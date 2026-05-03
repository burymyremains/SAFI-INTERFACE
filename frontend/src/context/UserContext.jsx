import { createContext, useState, useContext } from "react";
import {
  getAllUsersRequest,
  deleteUserRequest,
  getUserRequest,
  updateUserRequest,
  getAllLogs
} from "../api/users.api";

const UserContext = createContext();

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers debe estar dentro del proveedor UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState([]);

  const loadUsers = async () => {
    const res = await getAllUsersRequest();
    setUsers(res.data);
  };

  const loadUser = async (id) => {
    const res = await getUserRequest(id);
    return res.data;
  };

  const deleteUser = async (id) => {
    const res = await deleteUserRequest(id);
    if (res.status === 204) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  const loadLogs = async () => {
    const res = await getAllLogs();
    setUsers(res.data);
  }

  const updateUser = async (id, user) => {
    try {
      const res = await updateUserRequest(id, user);
      return res.data;
    } catch (error) {
      if (error.response) {
        setErrors([error.response.data.message]);
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        loadUser,
        loadUsers,
        deleteUser,
        errors,
        updateUser,
        loadLogs
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
