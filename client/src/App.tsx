import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { useAuthStore } from "./lib/store";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Topics from "./pages/Topics";
import TopicDetail from "./pages/TopicDetail";
import AddChild from "./pages/AddChild";
import Practice from "./pages/Practice";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import ParentSidebar from "./components/ParentSidebar";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const parent = useAuthStore((s) => s.parent);
  
  if (!parent) {
    return <div className="app-container"><Welcome /></div>;
  }

  return (
    <>
      <ParentSidebar />
      <div className="lg:ml-72">
        <Switch>
          <Route path="/" component={Topics} />
          <Route path="/add-child" component={AddChild} />
          <Route path="/topic/:topicId" component={TopicDetail} />
          <Route path="/practice/:operation" component={Practice} />
          <Route path="/results" component={Results} />
          <Route path="/dashboard" component={Dashboard} />
          <Route>
            <Topics />
          </Route>
        </Switch>
      </div>
    </>
  );
}

function AuthPage({ Component }: { Component: React.ComponentType }) {
  return (
    <div className="app-container">
      <Component />
    </div>
  );
}

function AuthRoutes() {
  return (
    <Switch>
      <Route path="/login">{() => <AuthPage Component={Login} />}</Route>
      <Route path="/signup">{() => <AuthPage Component={Signup} />}</Route>
      <Route path="/forgot-password">{() => <AuthPage Component={ForgotPassword} />}</Route>
      <Route>
        <ProtectedRoutes />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRoutes />
    </QueryClientProvider>
  );
}
