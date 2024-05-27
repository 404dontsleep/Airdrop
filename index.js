const HamsterKombat = require("./HamsterKombat");
`
Bearer 
`
  .split("\n")
  .filter((e) => e)
  .forEach((token) => {
    new HamsterKombat(token).run();
  });
