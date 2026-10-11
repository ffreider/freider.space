// three r128 ships without type declarations. The descent only hands it to
// the plain scripts in public/descent, so it's typed loosely.
declare module "three";
declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export const GLTFLoader: unknown;
}
