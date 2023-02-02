import { IConfig } from "../model";

export class PfParser {
  public parse(pfFile: string): IConfig {
    const config: IConfig = {
      id: "connection",
      label: "",
      name: "",
      description: "",
      host: "",
      port: "",
      user: "",
      password: "",
      group: "",
      params: "",
    };

    pfFile
      .split("\r\n")
      .filter((param) => {
        return param && param[0] !== "#";
      })
      .join(" ")
      .match(/(-[A-Za-z0-9]+)/g)
        .forEach((key) => {
          let regexStr;
          if (new RegExp(`(${key}\\s)(\'|\")`).test(pfFile)) {
            regexStr = `(${key}\\s)(\'|\")([^\'^\"]*)(\'|\")`;
          } else {
            regexStr = `(${key}\\s*)([\\S]+)*`;
          }
          const keyVal = pfFile.match(new RegExp(regexStr));
          switch (key) {
            case "-db":
              config.name = keyVal[0].substring(key.length);
              break;
            case "-U":
              config.user = keyVal[0].substring(key.length);
              break;
            case "-P":
              config.password = keyVal[0].substring(key.length);
              break;
            case "-H":
              config.host = keyVal[0].substring(key.length);
              break;
            case "-S":
              config.port = keyVal[0].substring(key.length);
              break;
            default:
              if (config.params) {
                config.params += " ";
              }
              config.params += keyVal[0];
              break;
          }
        });
    return config;
  }
}
