import { z } from "zod";

z.config({
  customError: (iss) => {
    switch (iss.code) {
      case "invalid_type":
        return iss.input === undefined || iss.input === null
          ? "required"
          : "invalidType";

      case "too_small": {
        if (iss.exact) return "length";
        if (iss.origin === "string")
          return Number(iss.minimum) === 1 ? "required" : "minLength";
        if (iss.origin === "array" || iss.origin === "set") return "minItems";
        return "minValue";
      }

      case "too_big": {
        if (iss.exact) return "length";
        if (iss.origin === "string") return "maxLength";
        if (iss.origin === "array" || iss.origin === "set") return "maxItems";
        return "maxValue";
      }

      case "invalid_format":
        return iss.format === "email" ? "email" : "invalid";

      default:
        return "invalid";
    }
  },
});