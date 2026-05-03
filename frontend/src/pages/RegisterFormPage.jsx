import { Card, Input, Textarea, Label, Button } from "../components/ui";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useUsers } from "../context/UserContext";

function UserFormPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const { updateUser, loadUser, errors: userErrors } = useUsers();
  const params = useParams();

  const onSubmit = handleSubmit(async (data) => {
    let user;

    if (!params.id) {
        //navigate("/users");
      <Link to="/users"></Link>
    } else {
      user = await updateUser(params.id, data)
    }

    if (user) {
      navigate("/users");
    }
  });

  useEffect(() => {
    if (params.id) {
      loadUser(params.id).then((user) => {
        setValue("username", user.username);
        setValue("email", user.email);
        setValue ("password", "")
        setValue("level", user.level);
      });
    }
  }, []);

  return (
    <div className="flex h-[80vh] justify-center items-center">
      <Card>
        {userErrors.map((error, i) => (
          <p className="text-red-500" key={i}>
            {error}
          </p>
        ))}
        <h2 className="text-3xl font-bold my-4">
          {params.id ? "Edit User" : "Create User"}
        </h2>
        <form onSubmit={onSubmit}>
        <Label htmlFor="name">Username</Label>
          <Input
            placeholder="Enter your username"
            {...register("name", {
              required: true,
            })}
          />
          {errors.name && <p className="text-red-500">name is required</p>}

          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: true,
            })}
          />
          {errors.email && <p className="text-red-500">email is required</p>}

          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            placeholder="Enter your password"
            {...register("password", {
              required: true,
            })}
          />
          {errors.password && (
            <p className="text-red-500">password is required</p>
          )}

          <Label>User Type</Label>
          <div className="flex items-center mb-4">
            <Label htmlFor="level">Select User Type</Label>
            <span className="mx-4" />
            <select className="custom-select" {...register("level", {
              valueAsNumber: true,
            })}>
              <option className="custom-option" value={1}>Guardia</option>
              <option className="custom-option" value={2}>Administrador</option>
            </select>
          </div>
          {errors.level && <p className="text-red-500">User type is required</p>}

          <Button>{params.id ? "Edit User" : "Create User"}</Button>
        </form>
      </Card>
    </div>
  );
}

export default UserFormPage;
