import { Constants } from "../../common/Constants";
import { IPort } from "../../view/app/model";
import { ServiceFactory } from "../ServiceFactory";
import { IPortsService } from "../interfaces/IPortsService";

export class PortsService implements IPortsService {
  private reservedPort: number | undefined = undefined;

  public reservePort(): number | undefined {
    const portList = ServiceFactory.getUserStorageService().globalGet<{
      [id: string]: IPort;
    }>(`${Constants.globalExtensionKey}.portList`)!;

    if (!portList) {
      //TODO msg
    } else {
      for (const id of Object.keys(portList)) {
        if (!portList[id].isInUse) {
          this.reservedPort = portList[id].port;
          portList[id].isInUse = true;
          portList[id].timestamp = Date.now();
          ServiceFactory.getUserStorageService().globalUpdate(
            `${Constants.globalExtensionKey}.portList`,
            portList
          );
          break;
        }
      }
    }
    return this.reservedPort;
  }
  public releasePort(): boolean {
    const portList = ServiceFactory.getUserStorageService().globalGet<{
      [id: string]: IPort;
    }>(`${Constants.globalExtensionKey}.portList`);

    if (!portList) {
      return false;
    }

    for (const id of Object.keys(portList)) {
      if (
        portList[id].isInUse &&
        Date.now() - portList[id].timestamp! > 35000
      ) {
        portList[id].isInUse = false;
        portList[id].timestamp = undefined;
        // createJsonDatabases; WTF?????????????????????
        ServiceFactory.getUserStorageService().globalUpdate(
          `${Constants.globalExtensionKey}.portList`,
          portList
        );

        return true;
      }
    }

    return false;
  }
}
