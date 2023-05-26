import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { createReview } from '../store';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const AddReview = () => {
  const { auth, tasks, users } = useSelector(state => state);
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  console.log('tasks:', tasks)
  console.log('id:', id)
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const task = tasks.find(task => task.id === id);

  if(!task){
    return null;
  }

  const user = users.find(user => user.id === task.taskDoerId );
  if(!user){
    return null;
  }

  const create = (ev) => {
    ev.preventDefault();
    try{
      dispatch(createReview({ userId: auth.id, taskId: task.id, taskDoerId: task.taskDoerId, rating, title, comment }));
      navigate(`/users/${task.taskDoerId}`);
    }
    catch(ex){
      console.log(ex);
    }
  };

  return (
    <div>
      <h2>Create a Review for: { user.username }</h2>
      <h3>Job: { task.title }</h3>
      <form onSubmit={ create }>
        <Rating value={ rating } onChange={ ev => setRating(Number(ev.target.value)) } placeholder='rating' />
        <TextField  id="outlined-basic" label="Title" variant="outlined" value={ title } onChange={ ev => setTitle(ev.target.value) } />
        <TextField  id="outlined-basic" label="Comment" variant="outlined" value={ comment } onChange={ ev => setComment(ev.target.value) } />
        <Button variant="outlined" type="submit">Add Review</Button>
      </form>
    </div>
    );
};

export default AddReview;