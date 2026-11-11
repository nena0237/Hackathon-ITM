import type { Receta } from '../domain/tipos'

/** Colección predefinida: 22 recetas creativas con raíz colombiana. Ingredientes en minúscula. */
export const RECETAS: Receta[] = [
  // ===== Cocinables con el seed =====
  {
    id: 'huevos-pericos',
    nombre: 'Huevos pericos gratinados con queso',
    ingredientes: [
      { nombre: 'huevos', cantidad: 3, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 60, unidad: 'g' },
    ],
    instrucciones:
      'Sofríe la cebolla y el tomate picados hasta que suelten su jugo.\nAgrega los huevos batidos y revuelve a fuego bajo.\nEspolvorea el queso rallado, tapa un minuto para gratinar y sirve.',
  },
  {
    id: 'pollo-costra-maiz-queso',
    nombre: 'Pollo en costra de maíz y queso',
    ingredientes: [
      { nombre: 'pollo', cantidad: 400, unidad: 'g' },
      { nombre: 'harina de maíz', cantidad: 150, unidad: 'g' },
      { nombre: 'huevos', cantidad: 2, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
      { nombre: 'tomate', cantidad: 1, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Corta el pollo en filetes, pásalos por huevo batido y luego por la harina de maíz mezclada con el queso rallado.\nHornea a 200 grados 20 minutos, volteando una vez.\nSirve con una salsa fresca de tomate y cebolla picados.',
  },
  {
    id: 'tacos-arepa-pollo-hogao',
    nombre: 'Tacos de arepa con pollo desmechado y hogao',
    ingredientes: [
      { nombre: 'harina de maíz', cantidad: 250, unidad: 'g' },
      { nombre: 'pollo', cantidad: 300, unidad: 'g' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
    ],
    instrucciones:
      'Cocina y desmecha el pollo. Prepara un hogao con tomate y cebolla y mézclalo con el pollo.\nForma arepas delgadas con la masa de harina de maíz y ásalas.\nDóblalas como tacos, rellénalas y cubre con queso rallado.',
  },
  {
    id: 'arroz-meloso-pollo-huevo',
    nombre: 'Arroz meloso de pollo con huevo frito',
    ingredientes: [
      { nombre: 'arroz', cantidad: 300, unidad: 'g' },
      { nombre: 'pollo', cantidad: 300, unidad: 'g' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'huevos', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Sofríe cebolla y tomate, dora el pollo en cubos y agrega el arroz.\nCubre con agua caliente y cocina destapado, revolviendo, hasta que quede meloso.\nSirve con un huevo frito de yema blanda encima.',
  },
  {
    id: 'bunuelos-horno',
    nombre: 'Buñuelos de maíz y queso al horno',
    ingredientes: [
      { nombre: 'harina de maíz', cantidad: 250, unidad: 'g' },
      { nombre: 'queso', cantidad: 200, unidad: 'g' },
      { nombre: 'huevos', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Mezcla la harina, el queso rallado y los huevos hasta obtener una masa suave.\nForma bolitas y colócalas en una bandeja engrasada.\nHornea a 190 grados 20 minutos hasta que doren.',
  },

  // ===== Parciales con un solo faltante =====
  {
    id: 'tortilla-papa-criolla',
    nombre: 'Tortilla de papa criolla y queso',
    ingredientes: [
      { nombre: 'huevos', cantidad: 5, unidad: 'unidad' },
      { nombre: 'papa criolla', cantidad: 400, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 80, unidad: 'g' },
    ],
    instrucciones:
      'Cocina la papa criolla en rodajas y sofríela con la cebolla en plumas.\nMezcla con los huevos batidos y el queso en cubos.\nCuaja en el sartén por ambos lados hasta que quede jugosa por dentro.',
  },
  {
    id: 'pollo-maracuya',
    nombre: 'Pollo glaseado de maracuyá con arroz',
    ingredientes: [
      { nombre: 'pollo', cantidad: 500, unidad: 'g' },
      { nombre: 'maracuyá', cantidad: 3, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'arroz', cantidad: 200, unidad: 'g' },
    ],
    instrucciones:
      'Dora el pollo en trozos con la cebolla picada.\nAgrega la pulpa de maracuyá y cocina hasta que la salsa se vuelva brillante.\nSirve sobre arroz blanco recién hecho.',
  },
  {
    id: 'mazamorra-cremosa',
    nombre: 'Mazamorra cremosa de maíz y queso',
    ingredientes: [
      { nombre: 'harina de maíz', cantidad: 150, unidad: 'g' },
      { nombre: 'leche', cantidad: 500, unidad: 'ml' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Disuelve la harina de maíz en la leche fría y cocina a fuego bajo sin dejar de revolver.\nCuando espese, retira del fuego y bate el huevo dentro de la crema.\nAgrega el queso en cubos y sirve caliente.',
  },

  // ===== Recetas con varios ingredientes por conseguir =====
  {
    id: 'shakshuka-criolla',
    nombre: 'Shakshuka criolla con plátano maduro',
    ingredientes: [
      { nombre: 'huevos', cantidad: 4, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 3, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'plátano maduro', cantidad: 1, unidad: 'unidad' },
      { nombre: 'pimentón', cantidad: 1, unidad: 'unidad' },
      { nombre: 'comino', cantidad: 3, unidad: 'g' },
      { nombre: 'queso', cantidad: 60, unidad: 'g' },
    ],
    instrucciones:
      'Sofríe cebolla, pimentón y tomate con el comino hasta lograr una salsa espesa.\nAgrega el plátano maduro en cubos y haz huecos para los huevos.\nTapa hasta que cuajen las claras y termina con queso rallado.',
  },
  {
    id: 'cazuela-mariscos-coco',
    nombre: 'Cazuela de mariscos al coco',
    ingredientes: [
      { nombre: 'camarón', cantidad: 300, unidad: 'g' },
      { nombre: 'calamar', cantidad: 200, unidad: 'g' },
      { nombre: 'leche de coco', cantidad: 400, unidad: 'ml' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'ají dulce', cantidad: 50, unidad: 'g' },
      { nombre: 'cilantro', cantidad: 15, unidad: 'g' },
    ],
    instrucciones:
      'Sofríe cebolla, tomate y ají dulce, y añade la leche de coco hasta que hierva suave.\nAgrega el calamar y cocina 5 minutos, luego el camarón 3 minutos más.\nTermina con cilantro picado y sirve con arroz.',
  },
  {
    id: 'albondigas-pollo-platano',
    nombre: 'Albóndigas de pollo y plátano en salsa de tomate',
    ingredientes: [
      { nombre: 'pollo', cantidad: 400, unidad: 'g' },
      { nombre: 'plátano verde', cantidad: 1, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 4, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
      { nombre: 'ajo', cantidad: 3, unidad: 'unidad' },
    ],
    instrucciones:
      'Muele el pollo con el plátano verde cocido, el huevo y el ajo picado, y forma albóndigas.\nCocina los tomates con la cebolla y licúalos hasta obtener una salsa.\nCocina las albóndigas en la salsa 15 minutos a fuego bajo.',
  },
  {
    id: 'empanadas-maiz-papa-criolla',
    nombre: 'Empanadas de maíz con papa criolla y hogao',
    ingredientes: [
      { nombre: 'harina de maíz', cantidad: 300, unidad: 'g' },
      { nombre: 'papa criolla', cantidad: 300, unidad: 'g' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'comino', cantidad: 3, unidad: 'g' },
    ],
    instrucciones:
      'Cocina y aplasta la papa criolla; mézclala con un hogao de tomate y cebolla y el comino.\nForma discos con la masa de harina de maíz, rellena y cierra.\nFríe o hornea hasta que queden doradas.',
  },
  {
    id: 'crema-ahuyama-coco',
    nombre: 'Crema de ahuyama con jengibre y coco',
    ingredientes: [
      { nombre: 'ahuyama', cantidad: 500, unidad: 'g' },
      { nombre: 'leche de coco', cantidad: 300, unidad: 'ml' },
      { nombre: 'jengibre', cantidad: 20, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'caldo de verduras', cantidad: 0.7, unidad: 'l' },
    ],
    instrucciones:
      'Sofríe la cebolla con el jengibre rallado y agrega la ahuyama en cubos.\nCubre con el caldo y cocina 20 minutos hasta que esté blanda.\nLicúa con la leche de coco y sirve caliente.',
  },
  {
    id: 'pescado-costra-lulo',
    nombre: 'Pescado en costra de maíz con salsa de lulo',
    ingredientes: [
      { nombre: 'pescado', cantidad: 400, unidad: 'g' },
      { nombre: 'harina de maíz', cantidad: 100, unidad: 'g' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
      { nombre: 'lulo', cantidad: 3, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'cilantro', cantidad: 10, unidad: 'g' },
    ],
    instrucciones:
      'Pasa los filetes por huevo y harina de maíz y dóralos en el sartén.\nLicúa la pulpa de lulo con cebolla y cilantro para hacer la salsa.\nSirve el pescado bañado con la salsa fría.',
  },
  {
    id: 'bowl-quinua-aguacate',
    nombre: 'Bowl de quinua con garbanzos y aguacate',
    ingredientes: [
      { nombre: 'quinua', cantidad: 200, unidad: 'g' },
      { nombre: 'garbanzos', cantidad: 150, unidad: 'g' },
      { nombre: 'aguacate', cantidad: 1, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
      { nombre: 'limón', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Cocina la quinua en el doble de agua y déjala enfriar.\nMezcla con los garbanzos cocidos, el tomate en cubos y el queso.\nCorona con aguacate en láminas y exprime el limón.',
  },
  {
    id: 'costillas-panela-cafe',
    nombre: 'Costillas glaseadas en panela y café',
    ingredientes: [
      { nombre: 'costilla de cerdo', cantidad: 0.8, unidad: 'kg' },
      { nombre: 'panela', cantidad: 80, unidad: 'g' },
      { nombre: 'café', cantidad: 100, unidad: 'ml' },
      { nombre: 'ajo', cantidad: 4, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'comino', cantidad: 3, unidad: 'g' },
    ],
    instrucciones:
      'Disuelve la panela en el café caliente y mezcla con ajo, cebolla picada y comino.\nMarina las costillas en la mezcla durante una hora.\nHornea tapado a 160 grados 90 minutos y destapa los últimos 15 para que se glasee.',
  },
  {
    id: 'lasana-platano-maduro',
    nombre: 'Lasaña de plátano maduro',
    ingredientes: [
      { nombre: 'plátano maduro', cantidad: 3, unidad: 'unidad' },
      { nombre: 'carne molida', cantidad: 400, unidad: 'g' },
      { nombre: 'tomate', cantidad: 3, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 200, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Corta el plátano maduro en láminas largas y dóralo.\nPrepara una salsa con la carne, el tomate y la cebolla.\nArma capas de plátano, carne y queso, cubre con huevo batido y hornea 25 minutos.',
  },
  {
    id: 'pasta-ahuyama-pollo',
    nombre: 'Pasta cremosa de ahuyama con pollo',
    ingredientes: [
      { nombre: 'pasta', cantidad: 300, unidad: 'g' },
      { nombre: 'ahuyama', cantidad: 300, unidad: 'g' },
      { nombre: 'pollo', cantidad: 300, unidad: 'g' },
      { nombre: 'queso', cantidad: 80, unidad: 'g' },
      { nombre: 'ajo', cantidad: 2, unidad: 'unidad' },
    ],
    instrucciones:
      'Cocina la ahuyama y lícuala con el ajo y el queso hasta obtener una crema.\nSella el pollo en tiras y mézclalo con la crema.\nIntegra con la pasta cocida y sirve de inmediato.',
  },
  {
    id: 'hamburguesa-lentejas-arepa',
    nombre: 'Hamburguesa de lentejas en arepa',
    ingredientes: [
      { nombre: 'lentejas', cantidad: 250, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'zanahoria', cantidad: 1, unidad: 'unidad' },
      { nombre: 'harina de maíz', cantidad: 80, unidad: 'g' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 100, unidad: 'g' },
    ],
    instrucciones:
      'Cocina las lentejas y aplástalas con la zanahoria rallada, la cebolla picada, el huevo y la harina.\nForma tortas y sella en el sartén.\nSírvelas entre dos arepas con queso derretido.',
  },
  {
    id: 'ceviche-mango-camaron',
    nombre: 'Ceviche de camarón y mango',
    ingredientes: [
      { nombre: 'camarón', cantidad: 300, unidad: 'g' },
      { nombre: 'mango', cantidad: 1, unidad: 'unidad' },
      { nombre: 'limón', cantidad: 4, unidad: 'unidad' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'cilantro', cantidad: 20, unidad: 'g' },
    ],
    instrucciones:
      'Cocina el camarón 2 minutos y enfríalo.\nMezcla con el jugo de los limones, la cebolla en plumas y el mango en cubos.\nRefrigera 15 minutos y termina con cilantro picado.',
  },
  {
    id: 'risotto-hogao-hongos',
    nombre: 'Risotto de hogao y hongos',
    ingredientes: [
      { nombre: 'arroz', cantidad: 250, unidad: 'g' },
      { nombre: 'hongos', cantidad: 200, unidad: 'g' },
      { nombre: 'cebolla', cantidad: 1, unidad: 'unidad' },
      { nombre: 'tomate', cantidad: 2, unidad: 'unidad' },
      { nombre: 'queso', cantidad: 80, unidad: 'g' },
      { nombre: 'caldo de verduras', cantidad: 0.8, unidad: 'l' },
    ],
    instrucciones:
      'Sofríe cebolla y tomate como un hogao y agrega los hongos laminados.\nAñade el arroz y el caldo caliente por tandas, revolviendo, durante 18 minutos.\nTermina con queso rallado y sirve cremoso.',
  },
  {
    id: 'bowl-paisa-ligero',
    nombre: 'Bowl paisa ligero',
    ingredientes: [
      { nombre: 'frijoles', cantidad: 200, unidad: 'g' },
      { nombre: 'arroz', cantidad: 150, unidad: 'g' },
      { nombre: 'chorizo', cantidad: 100, unidad: 'g' },
      { nombre: 'aguacate', cantidad: 1, unidad: 'unidad' },
      { nombre: 'huevos', cantidad: 1, unidad: 'unidad' },
      { nombre: 'plátano maduro', cantidad: 1, unidad: 'unidad' },
    ],
    instrucciones:
      'Cocina los frijoles hasta que estén blandos y el arroz aparte.\nDora el chorizo en rodajas y fríe el plátano maduro y el huevo.\nArma el bowl con todo y termina con aguacate en láminas.',
  },
]
