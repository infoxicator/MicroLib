"use strict";

import checkAcl from "@module-federation/aegis/esm/lib/check-acl";
import async from "@module-federation/aegis/esm/lib/async-error";
import domainEvents from "@module-federation/aegis/esm/models/domain-events";

const commandType = {
  /**
   *
   * @param {function(import("@module-federation/aegis/esm/models/model").Model)} command
   * @param {import("@module-federation/aegis/esm/models/model").Model} model
   */
  function: async (command, model) => command(model),
  /**
   *
   * @param {string} command
   * @param {import("@module-federation/aegis/esm/models/model").Model} model
   */
  string: async (command, model) => model[command](),
};

function commandAuthorized(spec, command, permission) {
  return (
    command &&
    spec.commands &&
    spec.commands[command] &&
    checkAcl(spec.commands[command].acl, permission)
  );
}

/**
 *
 * @param {import("@module-federation/aegis/esm/models/model").Model} model
 * @param {command:string} command - name of command
 * @param {string} permission - permission of caller
 */
export default async function executeCommand(model, command, permission) {
  const spec = model.getSpec();

  if (commandAuthorized(spec, command, permission)) {
    const cmd = spec.commands[command].command;

    if (typeof cmd === "function" || model[cmd]) {
      const result = await async(commandType[typeof cmd](cmd, model));

      if (result.ok) {
        return { ...model, ...result.data };
      }
    }
    console.warn("command not found", command);
  }
  model.emit(domainEvents.unauthorizedCommand(model), command);

  return model;
}
