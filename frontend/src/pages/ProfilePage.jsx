import { useAuth } from "../context/AuthContext";
import { Avatar, Button, Box, Typography } from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

function ProfilePage() {
  const { user } = useAuth();

  // Función para determinar el tipo de usuario
  const getUserType = (level) => {
    return level === 2 ? "Admin" : "Guardia";
  };

  // Función para obtener el icono según el tipo de usuario
  const getUserIcon = (level) => {
    return level === 2 ? <AdminPanelSettingsOutlinedIcon /> : <SecurityOutlinedIcon />;
  };

  return (
    <div style={styles.container}>
      <Avatar alt={user.name} src={user.avatar} style={styles.avatar} />
      <div style={styles.userInfo}>
        <h2 style={styles.userName}>{user.name}</h2>
        <p style={styles.userEmail}>{user.email}</p>
        <p style={styles.userType}>
          Tipo de Usuario:{" "}
          <Box
            component="span"
            display="inline-flex"
            alignItems="center"
            bgcolor={user.level === 2 ? "#3f51b5" : "#f50057"}
            color="#fff"
            borderRadius="4px"
            px={2}
            py={1}
          >
            {getUserIcon(user.level)}
            <Typography variant="body1" ml={1}>
              {getUserType(user.level)}
            </Typography>
          </Box>
        </p>
        <p style={styles.username}>Username: {user.username}</p>
        <p style={styles.uid}>UID Hexadecimal: {user.uid_hex}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: 40,
  },
  avatar: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  userInfo: {
    textAlign: "center",
  },
  userName: {
    fontSize: 32,
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 20,
    color: "#666",
    marginBottom: 10,
  },
  userType: {
    fontSize: 20,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    color: "#666",
    marginBottom: 10,
  },
  uid: {
    fontSize: 20,
    color: "#666",
    marginBottom: 30,
  },
  editButton: {
    fontSize: 20,
    backgroundColor: "#007bff",
    color: "#fff",
  },
};

export default ProfilePage;
