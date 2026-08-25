import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './AuthService';
import { loginSuccess } from '../../redux/authSlice';
import Input from '../../components/Input';
import Button from '../../components/Button';

const TestLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleTestLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.testLogin(username, password);
      dispatch(loginSuccess({
        user: response.data.user,
        token: response.data.token
      }));
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        if (response.data.user.profile_completed) {
          navigate('/');
        } else {
          navigate('/setup');
        }
      }
    } catch(err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verification Login</h2>
        <p className="text-gray-500 mt-2">Internal verification access only.</p>
      </div>
      <form onSubmit={handleTestLogin}>
        <Input 
          type="text"
          label="Username"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={error}
          autoFocus
        />
        <div className="mt-4">
          <Input 
            type="password"
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button 
          type="submit" 
          fullWidth 
          loading={loading}
          className="mt-6"
        >
          Login
        </Button>
      </form>
    </div>
  );
};

export default TestLogin;
