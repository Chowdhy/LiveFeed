import React, { useState } from 'react';
import { useDispatch } from 'react-redux'
import { useStartStreamMutation } from '../redux/apiSlice'
import { setTitle } from '../redux/titleSlice'
import {Card,CardContent,Typography,Grid,List,ListItem,ListItemText,Paper,Box,Divider} from '@mui/material';
import { AccessTime, FormatListNumbered, ShoppingCart } from '@mui/icons-material';

export default function RecipesPage() {
  const dispatch = useDispatch()
  const [startStream] = useStartStreamMutation()
  const handleStart = async () => {
    const stream = await startStream('hello').unwrap()
    console.log('started stream:')
    console.log(stream)
  }

  React.useEffect(() => {
    dispatch(setTitle('Recipes'))
  }, [])

  
  
  const [currerntTab, setCurrentTab] = useState<'uploads' | 'manager'>('uploads');

  return (
    <div>
        <p>Recipe Management</p>
        <div style={{ display: 'flex', gap: '10px'}}>
          <button onClick={() => setCurrentTab('uploads')}> Recipe Uploads </button>
          <button onClick={() => setCurrentTab('manager')}> Recipe Manager </button>
        </div>

        {currerntTab === 'uploads' && <RecipeUploads />}
        {currerntTab === 'manager' && <RecipeManagement />}
    </div>
  )
}

function RecipeUploads() {
  const [recipes, setRecipes] = useState<{title: string; steps: { stepNum: number; stepDesc: string }[]; shoppingList: { item: string; amount: number; unit: string }[]; scheduledDate: string }[]>([]);
  const [title, setTitle] = useState<string>('');
  const [steps, setSteps] = useState<{ stepNum: number; stepDesc: string }[]>([]);
  const [shoppingList, setShoppingList] = useState<{ item: string; amount: number; unit: string }[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  const addStep = () => {
    setSteps([...steps, { stepNum: steps.length + 1, stepDesc: '' }]);
  };

  const addStepDesc = (stepCount: number, stepSentence: string) => {
    const updatedSteps = [...steps]; 
    for (let i = 0; i < updatedSteps.length; i++) {
      if (updatedSteps[i].stepNum === stepCount) {
        updatedSteps[i] = { ...updatedSteps[i], stepDesc: stepSentence };
        break;
      }
    }
    setSteps(updatedSteps);
  };

  const addShoppingItem = () => {
    setShoppingList([...shoppingList, { item: '', amount: 0, unit: '' }]);
  }
  
  const updateShoppingItem = (index: number, item: 'item' | 'amount' | 'unit', value: string | number) => {
    const updatedItemList = [...shoppingList];
    for (let i = 0; i < updatedItemList.length; i++) {
      if (i === index) {
        updatedItemList[i] = { ...updatedItemList[i], [item]: value };
        break;
      }
    }
    setShoppingList(updatedItemList);
  };

  const uploadRecipe = async () => {
    if (title && steps.length > 0 && shoppingList.length > 0 && scheduledDate) {
      const newRecipe = { title, steps, shoppingList, scheduledDate };
      try {
        const response = await fetch('/api/recipe/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRecipe),
        });
  
        if (response.ok) {
          const data = await response.json();
          alert("Recipe uploaded successfully");
          setRecipes([...recipes, newRecipe]);
          setTitle('');
          setSteps([]);
          setShoppingList([]);
          setScheduledDate('');
        } else {
          console.error("Failed to upload recipe:", response.statusText);
          alert("Failed to upload recipe.");
        }
      } catch (error) {
        console.error("Error uploading recipe to DB:", error);
        alert("Error uploading recipe to DB");
      }
    }
    else{
      console.error("Please fill in all the information before uploading")
    }
  };
  

  return (
    <div>
      <p>Recipe Uploads</p>

      <div>
        <label>Title:</label>
        <input type="text" placeholder="Recipe Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label>Steps:</label>
        {steps.map((step) => (
          <div key={step.stepNum}>
            <input type="text" placeholder={`Step ${step.stepNum}`} value={step.stepDesc} onChange={(e) => addStepDesc(step.stepNum, e.target.value)} />
          </div>
        ))}
        <button onClick={addStep}>Add Step</button>
      </div>

      <div>
        <label>Shopping List:</label>
        {shoppingList.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Item" value={item.item} onChange={(e) => updateShoppingItem(index, 'item', e.target.value)} />
            <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateShoppingItem(index, 'amount', parseFloat(e.target.value))} />
            <input type="text" placeholder="Unit (e.g., kg, g, ml)" value={item.unit} onChange={(e) => updateShoppingItem(index, 'unit', e.target.value)} />
          </div>
        ))}
        <button onClick={addShoppingItem}>Add Shopping Item</button>
      </div>

      <div>
        <label>Schedule Stream Date:</label>
        <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
      </div>

      <button onClick={uploadRecipe}>Upload Recipe</button>

      <div>
        <h4>Uploaded Recipes</h4>
        <ul>
          {recipes.map((recipe, i) => (
            <li key={i}>
              <strong>{recipe.title}</strong>
              <p>Steps:</p>
              <ol>
                {recipe.steps.map((step) => (
                  <li key={step.stepNum}>{step.stepDesc}</li>
                ))}
              </ol>
              <p>Shopping List:</p>
              <ul>
                {recipe.shoppingList.map((item, i) => (
                  <li key={i}>
                    {item.amount} {item.unit} of {item.item}
                  </li>
                ))}
              </ul>
              <p>Scheduled Date: {new Date(recipe.scheduledDate).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
      
    </div>
  );
}


function RecipeManagement () {
 
  
  interface Recipe {
    title: string;
    date: string;
    steps: { stepNum: number; stepDesc: string }[];
    shoppingList: { item: string; amount: number; unit: string }[];
  }

  const [recipeList, setRecipeList] = useState<Recipe | null>(null);

  React.useEffect(() => {
    fetchRecipes();
  }, []);
  const params = new URLSearchParams({

  });

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`/api/recipe/get?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRecipeList(data);
    } catch (error) {
      console.error("Error getting recipe list:", error);
    }
  };

  const formatDate = (dateStr: string | number | Date) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };
  if (!recipeList) {
    return (
      <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading recipe details...</Typography>
        </Paper>
      </Box>
    );
  }
 
  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>{recipeList.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <AccessTime sx={{ mr: 1 }} />
            <Typography variant="body2">{formatDate(recipeList.date)}</Typography>
          </Box>
        </CardContent>
      </Card>
 
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormatListNumbered sx={{ mr: 1 }} />
                <Typography variant="h6">Recipe Steps</Typography>
              </Box>
              <List>
                {recipeList.steps?.map((step) => (
                  <ListItem key={step.stepNum}>
                    <ListItemText
                      primary={
                        <Typography>
                          <strong>{step.stepNum}.</strong> {step.stepDesc}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
 
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCart sx={{ mr: 1 }} />
                <Typography variant="h6">Shopping List</Typography>
              </Box>
              <List>
                {recipeList.shoppingList?.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={item.item}
                        secondary={`${item.amount} ${item.unit}`}
                      />
                    </ListItem>
                    {index < recipeList.shoppingList.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
 };