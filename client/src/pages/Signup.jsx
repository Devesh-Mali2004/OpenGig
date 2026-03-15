import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [role, setRole] = useState('trainee');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', bio: '', skills: '', interests: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { 
            ...formData, 
            role,
            skills: formData.skills ? formData.skills.split(',') : [],
            interests: formData.interests ? formData.interests.split(',') : []
        };
        try {
            const res = await axios.post('http://localhost:5000/api/auth/signup', payload);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate(role === 'trainer' ? '/mentor-dashboard' : '/learner-dashboard');
        } catch (err) { alert(err.response.data.message); }
    };

    return (
        <div className="auth-form">
            <div className="tabs">
                <button onClick={() => setRole('trainee')} className={role==='trainee'?'active':''}>Learner</button>
                <button onClick={() => setRole('trainer')} className={role==='trainer'?'active':''}>Mentor</button>
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name" onChange={e => setFormData({...formData, name:e.target.value})} required />
                <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email:e.target.value})} required />
                <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password:e.target.value})} required />
                <textarea placeholder="Bio" onChange={e => setFormData({...formData, bio:e.target.value})} />
                
                {role === 'trainer' ? 
                    <input type="text" placeholder="Skills (comma separated)" onChange={e => setFormData({...formData, skills:e.target.value})} /> :
                    <input type="text" placeholder="Interests (comma separated)" onChange={e => setFormData({...formData, interests:e.target.value})} />
                }
                <button type="submit">Register Profile</button>
            </form>
        </div>
    );
};

export default Signup;