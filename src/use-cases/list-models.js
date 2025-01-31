"use strict";

const DateFunctions = {
  today: list =>
    list.filter(
      m => new Date(Date.parse(m.createTime)).getDate() == new Date().getDate()
    ).length,
  yesterday: list =>
    list.filter(
      m =>
        new Date(Date.parse(m.createTime)).getDate() == new Date().getDate() - 1
    ).length,
  thisMonth: list =>
    list.filter(
      m =>
        new Date(Date.parse(m.createTime)).getMonth() == new Date().getMonth()
    ).length,
  lastMonth: list =>
    list.filter(
      m =>
        new Date(Date.parse(m.createTime)).getMonth() ==
        new Date().getMonth() - 1
    ).length,
};

async function parseQuery(query, repository) {
  if (query?.count) {
    const dateFunc = DateFunctions[query.count];

    if (dateFunc) {
      const list = await repository.list();
      return {
        count: dateFunc(list),
      };
    }

    const searchTerms = query.count.split(":");

    if (searchTerms.length > 1) {
      const filter = { [searchTerms[0]]: searchTerms[1] };
      const filteredList = await repository.list(filter);

      return {
        ...filter,
        count: filteredList.length,
      };
    }

    return {
      count: (await repository.list(null, false)).length,
    };
  }
  return repository.list(query);
}

/**
 * @callback listModels
 * @param {{key1:string, keyN:string}} query
 * @returns {Promise<Array<import("../models/model").Model)>>}
 *
 * @param {{repository:import('../datasources/datasource').default}}
 * @returns {listModels}
 */
export default function listModelsFactory({ repository } = {}) {
  return async function listModels(query) {
    return parseQuery(query, repository);
  };
}
