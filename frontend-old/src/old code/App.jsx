import React, { useState } from "react";
import Messages from "./components/Messages"
import Video from "./components/Video"
import Input from "./components/Input"
import "./App.css"
function App(){

  return (
    <div class = "bg">
      <div class="left">
        <Messages/>
        
      </div>
      <div class="right">
        <Video/>
        <Input/>
      </div>
      
    </div>
  );
};

export default App