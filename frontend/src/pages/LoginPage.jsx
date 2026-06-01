import { Card, Input, Button, Label, Container } from "../components/ui";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const { signin, isAuth, errors: loginErrors } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/main";

    const onSubmit = handleSubmit(async (data) => {
        const user = await signin(data);
        if (user) {
            navigate(from, { replace: true });
        }
    });

    useEffect(() => {
        if (isAuth && location.pathname === "/login") {
            navigate(from, { replace: true });
        }
    }, [isAuth, navigate, from, location.pathname]);

    return (
        <Container className="h-[calc(100vh-10rem)] flex justify-center items-center">
            <Card>
                {loginErrors &&
                    loginErrors.map((err, idx) => (
                        <p key={idx} className="bg-red-500 text-white p-2 text-center">{err}</p>
                    ))}

                <h1 className="text-4xl font-bold my-2 text-center">Log in</h1>

                <form onSubmit={onSubmit}>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        placeholder="Email"
                        {...register("email", {
                            required: true,
                        })}
                    />
                    {errors.email && <p className="text-red-500">Email is required</p>}

                    <Label htmlFor="password">Password</Label>
                    <Input
                        type="password"
                        placeholder="Password"
                        {...register("password", {
                            required: true,
                        })}
                    />
                    {errors.password && (
                        <p className="text-red-500">Password is required</p>
                    )}

                    <div className="contenedor-flex">
                        <Button>Log in</Button>
                    </div>
                </form>
            </Card>
        </Container>
    );
}

export default LoginPage;