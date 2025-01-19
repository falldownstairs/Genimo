import React, { useState } from "react";
import "../styles/Input.css";

function Input() {
  const [text, setText] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setText("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setText("");
  };

  return (
    <div className="botbox">
      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          className="input-field"
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="submit-button">↳</button>
      </form>
    </div>
  );
}

export default Input;
