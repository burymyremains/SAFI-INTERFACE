import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const data = useAuth();
  const navigate = useNavigate();
  //console.log(data);

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return <div>

    <Card>
      <h1 className="text-3xl font-bold my-4">Bienvienid@ a SAFI</h1>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <img
            src={'src/assets/safi.png'}
            alt="SAFI Logo"
            width='30%'
            height='75px'
          />
          <img
            src={'src/assets/PotroRockets_PNG.png'}
            alt="Potro Rockets Logo"
            width='30%'
            height='75px'
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleLoginRedirect} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007BFF', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Login
          </button>
        </div>
    </Card>

  </div>;
}

export default HomePage;
