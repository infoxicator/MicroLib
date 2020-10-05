import {
  addModels,
  editModels,
  listModels,
  findModels,
  removeModels
} from '../use-cases';
import postModelFactory from './post-model';
import patchModelFactory from './patch-model';
import getModelFactory from './get-model';
import getModelByIdFactory from './get-model-by-id';
import deleteModelFactory from "./delete-model";

function make(useCases, controllerFactory) {
  return useCases().map(useCase => ({
    modelName: useCase.modelName,
    fn: controllerFactory(useCase.fn)
  }));
}

export const postModels = () => make(addModels, postModelFactory);
export const patchModels = () => make(editModels, patchModelFactory);
export const getModels = () => make(listModels, getModelFactory);
export const getModelsById = () => make(findModels, getModelByIdFactory);
export const deleteModels = () => make(removeModels, deleteModelFactory);

