import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Bot, Sparkles } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = login(username, password);
    
    if (result.success) {
      toast({
        title: "Welcome to AnimAI Pro",
        description: "Login successful! Redirecting to dashboard...",
      });
    } else {
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-purple-500/10" />
      
      <Card className="w-full max-w-md bg-[#161616]/80 backdrop-blur-xl border-white/10 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 rounded-lg" />
        
        <CardHeader className="text-center space-y-4 relative">
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <Bot className="h-8 w-8 text-teal-400" />
              <Sparkles className="h-4 w-4 text-purple-400 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              Anix Flow
            </h1>
          </div>
          
          <CardTitle className="text-white text-xl">С возвращением, творец!</CardTitle>
          <CardDescription className="text-gray-400">
            Твоя вселенная анимации ждёт.
          </CardDescription>
          
          <div className="text-xs text-gray-500 bg-white/5 p-2 rounded border border-white/10">
            Демо-доступ: admin / admin
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-teal-400/50 focus:ring-teal-400/20"
                placeholder="Введите имя пользователя"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="Пароль" className="text-gray-300">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-teal-400/50 focus:ring-teal-400/20"
                placeholder="Введите пароль"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "Погружение..." : "Погрузиться в творчество"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;