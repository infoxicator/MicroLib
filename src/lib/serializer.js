"use strict";

/**
 * @typedef {import('../models/index').serializer} serializerType
 */

/**
 * @type {serializerType}
 */
export const replaceMap = {
  on: "serialize",
  key: "*",
  type: (key, value) => value instanceof Map,
  value: (key, value) => [...value],
};

/**
 * @type {serializerType}
 */
export const replaceFunction = {
  on: "serialize",
  key: "*",
  type: "function",
  value: (key, value) => value.toString(),
};

/**
 * @type {serializerType}
 */
export const reviveFunction = {
  on: "deserialize",
  key: "function",
  type: "string",
  value: (key, value) => eval(`(${value})`),
};

const serializers = {
  /**
   * @type {serializerType[]}
   */
  serialize: [],
  /**
   * @type {serializerType[]}
   */
  deserialize: [],
};

/**
 *
 * @param {serializerType} s
 */
function checkTypes(s) {
  return (
    ["serialize", "deserialize"].includes(s.on) &&
    (["function", "string"].includes(typeof s.key) ||
      s.key instanceof RexExp) &&
    (["string", "number", "function", "object"].includes(s.type) ||
      s.type instanceof RegExp ||
      typeof s.type === "function") &&
    typeof s.value === "function"
  );
}

/**
 *
 * @param {serializerType} serializer
 */
function checkRequiredProps(serializer) {
  const requiredProps = ["on", "key", "type", "value"];
  const missing = requiredProps.filter((key) => !serializer[key]);
  if (missing && missing.length > 0) {
    throw new Error("missing required property: ", missing);
  }
}

/**
 *
 * @param {serializerType[]} serializers
 * @returns {serializerType[]}
 */
function validateSerializer(serializers) {
  const newSerializers = Array.isArray(serializers)
    ? serializers
    : [serializers];
  newSerializers.every((s) => checkRequiredProps(s));

  if (!newSerializers.every((s) => checkTypes(s))) {
    throw new Error("invalid serializer, check property types");
  }
  return newSerializers;
}

const keyApplies = {
  /**
   * @param {serializerType} s
   * @returns {boolean}
   */
  object: (s, k, v) => s.key.test(k),
  /**
   * @param {serializerType} s
   */
  string: (s, k, v) => s.key === k || s.key === "*",
  /**
   * @param {serializerType} s
   * @returns {boolean}
   */
  function: (s, k, v) => s.key(k, v),
};

const typeApplies = {
  /**
   * @param {serializerType} s
   * @returns {boolean}
   */
  object: (s, k, v) => s.type.test(k),
  /**
   * @param {serializerType} s
   */
  string: (s, k, v) => s.type === typeof v,
  /**
   * @param {serializerType} s
   * @returns {boolean}
   */
  function: (s, k, v) => s.type(k, v),
};

/**
 *
 * @param {serializerType} serializer
 * @param {*} key
 * @param {*} value
 * @returns {boolean}
 */
function applies(serializer, key, value) {
  return (
    typeApplies[typeof serializer.type](serializer, key, value) &&
    keyApplies[typeof serializer.key](serializer, key, value)
  );
}

function findDeserializer(key, value) {
  return serializers["deserialize"].find((s) => applies(s, key, value));
}

function findSerializer(key, value) {
  return serializers["serialize"].find((s) => applies(s, key, value));
}

const Serializer = {
  /**
   *
   * @param {serializerType | serializerType[]} s
   */
  addSerializer(s) {
    const newSerializers = validateSerializer(s);
    newSerializers.forEach((s) => serializers[s.on].push(s));
    console.log("serializers ", serializers);
  },

  serialize(key, value) {
    const serializer = findSerializer(key, value);
    if (serializer) {
      return serializer.value(key, value);
    }
    return value;
  },

  deserialize(key, value) {
    const deserializer = findDeserializer(key, value);
    if (deserializer) {
      return deserializer.value(key, value);
    }
    return value;
  },
};

export default Serializer;
