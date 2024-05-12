const express = require("express");
const app = express();
const http = require("http");
const Compiler = require('compilex');
const fs = require('fs');
const cors = require('cors');
app.use(express.json());

const { Server } = require("socket.io");
const ACTIONS = require("./Actions");

const server = http.createServer(app);

const io = new Server(server);

const userSocketMap = {};
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.get('/', (req, res) => {
  Compiler.flush(() => {
    console.log("Delete")
  })
})

// *********************************************************Compiler Request******************************************** 
var options = { stats: true };
Compiler.init(options);
app.post('/compile', (req, res) => {
  const code = req.body.code;
  const input = req.body.input;
  const language = req.body.language;
  console.log(language)
  if (language === "python") {
    if (!input) {
      var envData = { OS: "windows" };
      Compiler.compilePython(envData, code, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    } else {
      var envData = { OS: "windows" };
      Compiler.compilePythonWithInput(envData, code, input, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    }
  }
  else if (language === "cpp") {
    if (!input) {
      var envData = { OS: "windows", cmd: "g++", options: { timeout: 5000 } };
      Compiler.compileCPP(envData, code, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    } else {
      var envData = { OS: "windows", cmd: "g++", options: { timeout: 5000 } };
      Compiler.compileCPPWithInput(envData, code, input, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    }

  }
  else {
    if (!input) {
      var envData = { OS: "windows" };
      Compiler.compileJava(envData, code, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    } else {
      var envData = { OS: "windows" };
      envData.options = envData.options || {};
      envData.options.timeout = 5000;
      Compiler.compileJavaWithInput(envData, code, input, function (data) {
        if (data.error) {
          console.error('Compilation error:', data.error);
          const errorData = data.error;
          res.json(errorData);
        } else {
          res.json(data.output);
        }
      });
    }
  }
});



const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));