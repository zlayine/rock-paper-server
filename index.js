const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origins: [process.env.CORS_URL],
  },
});

http.listen(3000, () => {
  console.log("listening http on *:3000");
});

const channels = [];

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("disconnect", () => {
    channels.map((c) => {
      c.users = c.users.filter((u) => u !== socket.id);
      return c;
    });
    console.log("user disconnected");
  });

  socket.on("join channel", (channel) => {
    socket.join(channel);

    const exist = channels.find((c) => c.channel === channel);

    if (exist) {
      if (exist.users.includes(socket.id) || exist.users.length === 2) return;

      channels.map((c) => {
        if (c.channel === channel) {
          c.users.push(socket.id);
        }
        return c;
      });

      socket.to(channel).emit("user connected");
    } else {
      channels.push({ channel, users: [socket.id] });
    }

    console.log("joined", channels);
  });

  socket.on("choice", (data) => {
    console.log("choice made", data);
    socket.to(data.channel).emit("choice", data.choice);
  });

  socket.on("ready", (channel) => {
    socket.to(channel).emit("ready");
  });

  socket.on("play again", (channel) => {
    socket.in(channel).emit("play again");
  });

  socket.on("leave channel", (channel) => {
    socket.leave(channel);
    channels.map((c) => {
      c.users = c.users.filter((u) => u !== socket.id);
      return c;
    });
    socket.to(channel).emit("leave channel");
  });
});
