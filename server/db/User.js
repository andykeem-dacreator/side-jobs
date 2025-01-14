const conn = require("./conn");
const { faker } = require("@faker-js/faker");
const { STRING, UUID, UUIDV4, TEXT, BOOLEAN, FLOAT } = conn.Sequelize;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT_SECRET;
const socketMap = require("../socketMap");

const User = conn.define("user", {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4,
  },
  avatar: {
    type: TEXT,
  },
  username: {
    type: STRING,
    unique: true,
  },
  password: {
    type: STRING,
  },
  firstName: {
    type: STRING,
  },
  lastName: {
    type: STRING,
  },
  email: {
    type: STRING,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  wallet: {
    type: FLOAT,
    defaultValue: 1000,
  },
  isAdmin: {
    type: BOOLEAN,
    defaultValue: false,
  },
  aboutMe: {
    type: TEXT,
  },
});

User.prototype.sendMessage = async function (message) {
  message = await conn.models.message.create({ ...message, fromId: this.id });
  message = await conn.models.message.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "from",
        attributes: ["username", "id"],
      },
      {
        model: User,
        as: "to",
        attributes: ["username", "id"],
      },
    ],
  });
  if (socketMap[message.toId]) {
    socketMap[message.toId].socket.send(
      JSON.stringify({ type: "CREATE_MESSAGE", message })
    );
  }
  return message;
};

User.prototype.messagesForUser = function () {
  return conn.models.message.findAll({
    order: [["createdAt"]],
    where: {
      [conn.Sequelize.Op.or]: [
        {
          toId: this.id,
        },
        {
          fromId: this.id,
        },
      ],
    },
    include: [
      {
        model: User,
        as: "from",
        attributes: ["username", "id"],
      },
      {
        model: User,
        as: "to",
        attributes: ["username", "id"],
      },
    ],
  });
};

User.addHook("beforeSave", async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 5);
  }
});

User.findByToken = async function (token) {
  try {
    const { id } = jwt.verify(token, JWT);
    const user = await this.findByPk(id);
    if (user) {
      return user;
    }
    throw "user not found";
  } catch (ex) {
    const error = new Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.prototype.generateToken = function () {
  return jwt.sign({ id: this.id }, JWT);
};

User.authenticate = async function ({ username, password }) {
  const user = await this.findOne({
    where: {
      username,
    },
  });
  if (user && (await bcrypt.compare(password, user.password))) {
    return jwt.sign({ id: user.id }, JWT);
  }
  const error = new Error("bad credentials");
  error.status = 401;
  throw error;
};

module.exports = User;
