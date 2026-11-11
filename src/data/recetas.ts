import type { Receta } from '../domain/tipos'

/** Colección predefinida: 12 recetas caseras colombianas. Ingredientes en minúscula. */
export const RECETAS: Receta[] = [
  {
    id: 'huevos-pericos',
    nombre: 'Huevos pericos',
    ingredientes: [
      { nombre: 'huevos', cantidad: 3, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Pica el tomate y la cebolla y sofríelos en un sartén con un poco de aceite.\nCuando estén blandos, agrega los huevos batidos.\nRevuelve hasta que cuajen y sirve caliente.',
  },
  {
    id: 'arepas-con-queso',
    nombre: 'Arepas con queso',
    ingredientes: [
      { nombre: 'harina de maíz', cantidad: 0.5, unidad: 'kg' },
      { nombre: 'queso', cantidad: 150, unidad: 'g' },
    ],
    instrucciones:
      'Mezcla la harina con agua tibia y una pizca de sal hasta formar una masa suave.\nForma las arepas, rellénalas con el queso rallado y ciérralas.\nAsa por ambos lados hasta que doren.',
  },
  {
    id: 'arroz-con-huevo',
    nombre: 'Arroz con huevo',
    ingredientes: [
      { nombre: 'arroz', cantidad: 200, unidad: 'g' },
      { nombre: 'huevos', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Cocina el arroz con el doble de agua y sal.\nFríe los huevos aparte.\nSirve el arroz con los huevos encima.',
  },
  {
    id: 'sopa-de-tomate',
    nombre: 'Sopa de tomate',
    ingredientes: [
      { nombre: 'tomate', cantidad: 3, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'ajo', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Sofríe la cebolla y el ajo picados y agrega los tomates en trozos.\nAñade un litro de agua y cocina 20 minutos.\nLicúa, cuela y sirve caliente.',
  },
  {
    id: 'omelette-de-queso',
    nombre: 'Omelette de queso',
    ingredientes: [
      { nombre: 'huevos', cantidad: 3, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
    ],
    instrucciones:
      'Bate los huevos con una pizca de sal.\nVierte en un sartén caliente, agrega el queso y dobla cuando cuaje.',
  },
  {
    id: 'arroz-con-pollo',
    nombre: 'Arroz con pollo',
    ingredientes: [
      { nombre: 'arroz', cantidad: 300, unidad: 'g' },
      { nombre: 'pollo', cantidad: 400, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Sofríe la cebolla picada y dora el pollo en trozos.\nAgrega el arroz y el doble de agua con sal.\nCocina tapado a fuego bajo hasta que el arroz esté listo.',
  },
  {
    id: 'sudado-de-pollo',
    nombre: 'Sudado de pollo',
    ingredientes: [
      { nombre: 'pollo', cantidad: 500, unidad: 'g' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'papa', cantidad: 500, unidad: 'g' },
    ],
    instrucciones:
      'Pon en una olla capas de cebolla, tomate, papa en rodajas y pollo, con sal y comino.\nAgrega media taza de agua y cocina tapado a fuego bajo 40 minutos.',
  },
  {
    id: 'ensalada-de-tomate-y-cebolla',
    nombre: 'Ensalada de tomate y cebolla',
    ingredientes: [
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Corta el tomate en rodajas y la cebolla en plumas finas.\nAliña con sal, aceite y un poco de limón o vinagre.',
  },
  {
    id: 'arroz-con-leche',
    nombre: 'Arroz con leche',
    ingredientes: [
      { nombre: 'arroz', cantidad: 150, unidad: 'g' },
      { nombre: 'leche', cantidad: 1, unidad: 'l' },
    ],
    instrucciones:
      'Cocina el arroz en agua hasta que esté casi tierno y escúrrelo.\nAgrega la leche y cocina a fuego bajo revolviendo hasta que espese.\nEndulza al gusto y sirve tibio o frío.',
  },
  {
    id: 'papas-con-queso',
    nombre: 'Papas con queso',
    ingredientes: [
      { nombre: 'papa', cantidad: 500, unidad: 'g' },
      { nombre: 'queso', cantidad: 150, unidad: 'g' },
    ],
    instrucciones:
      'Cocina las papas con cáscara en agua con sal y pélalas.\nSírvelas con el queso rallado por encima y un poco de ají.',
  },
  {
    id: 'huevos-rancheros',
    nombre: 'Huevos rancheros',
    ingredientes: [
      { nombre: 'huevos', cantidad: 3, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'tortilla', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Prepara un hogao con el tomate y la cebolla picados.\nFríe los huevos y colócalos sobre las tortillas calientes.\nCubre con el hogao y sirve.',
  },
  {
    id: 'sandwich-gratinado',
    nombre: 'Sándwich gratinado',
    ingredientes: [
      { nombre: 'pan', cantidad: 2, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
      { nombre: 'jamón', cantidad: 100, unidad: 'g' },
    ],
    instrucciones:
      'Arma el sándwich con el jamón y el queso entre las dos tajadas de pan.\nTuéstalo en el sartén por ambos lados hasta que el queso se derrita.',
  },
]
