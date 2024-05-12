import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import '../App.css'
import axios from 'axios';
import Navbar from "./Navbar";
import CodeMirror from "codemirror";
import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const [output, setOutput] = useState('')
  const [Editor, setEditor] = useState('')
  const [input, setInput] = useState('');
  const [language, setlanguage] = useState('') 
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        textareaRef.current,
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          // readOnly: readOnly 
        }
      );
      // for sync the code 
       
        editor.setValue(`\npublic class Main {
         public static void main(String[] args) {\n          System.out.println("Hello, world!");\n        }\n}`);
      
      setEditor(editor);
      editorRef.current = editor;

      editor.setSize(null, "100%");
      editorRef.current.on("change", (instance, changes) => {
        // console.log("changes", instance ,  changes );
        const { origin } = changes;
        const code = instance.getValue(); // code has value which we write
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
            // readOnly
          });
        }
      });
    };

    init(); 
  }, []);

  useEffect(() => {
    if (language === "python") {
      editorRef.current.setValue(`print("Hello Python")`);
    } else if (language === "cpp") {
       editorRef.current.setValue(`#include <iostream>\n\nint main() {\n    std::cout << "Hello, Cpp!" << std::endl;\n    return 0;\n}`);
    } else {
      editorRef.current.setValue(`\npublic class Main {
        public static void main(String[] args) {\n
          System.out.println("Hello, Java!");\n
        }\n
      }`);
    }
  }, [language]);

  

  // data receive from server
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  const handleRunClick = async (e) => {
    console.log('clicked!!!!')
    e.preventDefault();
    if (!Editor) return;

    const code = {
      code: Editor.getValue(), // Retrieve code from CodeMirror editor
      input: input,
      language: language


    };
    // console.log(code) // perfectly getting code
    try {
      const response = await axios.post('http://localhost:5000/compile', code);
      console.log('Received data:', response.data);
      setOutput(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };



  return (
    <div>
      <Navbar handleRunClick={handleRunClick} selectedLanguage={setlanguage} />
      <div className="editor-container" style={{ display: "flex" }}>
        <div >
          <form style={{ height: "400px", width: "1000px" }} onSubmit={handleRunClick}>
            <textarea id="realtimeEditor" ref={textareaRef}></textarea>
          </form>
        </div>
        <div className="inputBox" style={{ height: "400px", width: "250px" }}>
          <h2>Input Value</h2>
          <textarea
            cols="30"
            rows="13"
            value={input}
            onChange={(e) => setInput(e.target.value)} // Update state when input changes
          ></textarea>
        </div>
      </div>
      <div className="output">
        {output && <div className="output">{output}</div>}
      </div>

    </div>

  );
}

export default Editor;
