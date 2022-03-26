import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store";

const Home: React.FC = () => {
  const editor = useSelector((state: RootState) => state.app.editor);
  return <Navigate to={editor.id ? `/edit/${editor.id}` : "/new"} />;
};

export default Home;