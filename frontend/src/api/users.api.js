import axios from "./axios";

export const getAllUsersRequest = () => axios.get("/users");

export const getAllLogs = () => axios.get("/userslog");

export const deleteUserRequest = (id) => axios.delete(`/users/${id}`);

export const getUserRequest = (id) => axios.get(`/users/${id}`);

export const updateUserRequest = (id, user) => axios.put(`/users/${id}`, user);
