import AuthLayout from "@/components/layout/AuthLayout";
import { useAppStore } from "@/lib/store/index";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const login = useAppStore((state) => state.login);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock login delay
        setTimeout(() => {
            login("demo@spine.com");
            setLoading(false);
            navigate("/");
        }, 800);
    };

    return (
        <AuthLayout>
            <Card className="w-full shadow-lg border-2">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your workspace
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="doctor@spine.com" defaultValue="demo@spine.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" defaultValue="password" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" type="button">
                            Hospital SSO
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <div className="text-center text-sm text-muted-foreground">
                <a href="#" className="underline hover:text-primary">
                    Forgot your password?
                </a>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
