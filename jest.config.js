const dotenv = require("dotenv");

const { error } = dotenv.config({
  path: ".env",
});

if (error) {
  throw new Error("Make sure you create a `.env` file");
}

module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
