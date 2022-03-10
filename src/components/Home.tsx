import React from "react";
import { Navigate } from "react-router-dom";

const Home: React.FC = () => {
  const storedDocument = window.localStorage.getItem("document");
  const documentId = storedDocument && JSON.parse(storedDocument)?.id;

  return  <Navigate to={documentId?`/edit/${documentId}`: "/new"} />;
};

export default Home;