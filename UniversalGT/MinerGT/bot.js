const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const toolPlugin = require('mineflayer-tool').plugin
const { mineflayer: viewer } = require('prismarine-viewer')
const fs = require('fs')

// ---------------------------
// Minerales y bloques
// ---------------------------
const vanillaOres = [
  "minecraft:coal_ore","minecraft:diamond_ore","minecraft:emerald_ore",
  "minecraft:gold_ore","minecraft:iron_ore","minecraft:lapis_ore",
  "minecraft:nether_quartz_ore","minecraft:redstone_ore",
  "minecraft:amethyst_block","minecraft:budding_amethyst",
  "minecraft:pointed_dripstone","minecraft:dripstone_block"
]

const gregTechOres = [
  "gregtech:ore_almandine","gregtech:ore_aluminium","gregtech:ore_amethyst",
  "gregtech:ore_apatite","gregtech:ore_banded_iron","gregtech:ore_barite",
  "gregtech:ore_bastnasite","gregtech:ore_bauxite","gregtech:ore_bentonite",
  "gregtech:ore_beryllium","gregtech:ore_bismuth","gregtech:ore_blue_topaz",
  "gregtech:ore_bornite","gregtech:ore_brown_limonite","gregtech:ore_calcite",
  "gregtech:ore_cassiterite","gregtech:ore_certus_quartz","gregtech:ore_chalcocite",
  "gregtech:ore_chalcopyrite","gregtech:ore_chromite","gregtech:ore_cinnabar",
  "gregtech:ore_cobalt","gregtech:ore_cobaltite","gregtech:ore_copper",
  "gregtech:ore_cuprite","gregtech:ore_enargite","gregtech:ore_enriched_naquadah",
  "gregtech:ore_galena","gregtech:ore_garniertite","gregtech:ore_glauconite",
  "gregtech:ore_graphite","gregtech:ore_green_sapphire","gregtech:ore_grossular",
  "gregtech:ore_ilmenite","gregtech:ore_iridium","gregtech:ore_jasper",
  "gregtech:ore_lazurite","gregtech:ore_lead","gregtech:ore_lepidolite",
  "gregtech:ore_lignite_coal","gregtech:ore_lithium","gregtech:ore_magnesite",
  "gregtech:ore_magnetite","gregtech:ore_malachite","gregtech:ore_molybdenite",
  "gregtech:ore_molybdenum","gregtech:ore_monazite","gregtech:ore_naquadah",
  "gregtech:ore_neodymium","gregtech:ore_nickel","gregtech:ore_niobium",
  "gregtech:ore_oilsands","gregtech:ore_olivine","gregtech:ore_opal",
  "gregtech:ore_osmium","gregtech:ore_palladium","gregtech:ore_pentlandite",
  "gregtech:ore_phosphate","gregtech:ore_phosphor","gregtech:ore_pitchblende",
  "gregtech:ore_platinum","gregtech:ore_powellite","gregtech:ore_pyrite",
  "gregtech:ore_pyrolusite","gregtech:ore_pyrope","gregtech:ore_quartzite",
  "gregtech:ore_red_garnet","gregtech:ore_rock_salt","gregtech:ore_ruby",
  "gregtech:ore_rutile","gregtech:ore_salt","gregtech:ore_saltpeter",
  "gregtech:ore_sapphire","gregtech:ore_scheelite","gregtech:ore_sheldonite",
  "gregtech:ore_silver","gregtech:ore_soapstone","gregtech:ore_sodalite",
  "gregtech:ore_spessartine","gregtech:ore_sphalerite","gregtech:ore_spodumene",
  "gregtech:ore_stibnite","gregtech:ore_sulfur","gregtech:ore_talc",
  "gregtech:ore_tantalite","gregtech:ore_tanzanite","gregtech:ore_tennantite",
  "gregtech:ore_tenorite","gregtech:ore_tetrahedrite","gregtech:ore_thorium",
  "gregtech:ore_tin","gregtech:ore_topaz","gregtech:ore_tungstate",
  "gregtech:ore_uraninite","gregtech:ore_uranium_235","gregtech:ore_uranium_238",
  "gregtech:ore_vanadium_magnetite","gregtech:ore_vinteum","gregtech:ore_wulfenite",
  "gregtech:ore_yellow_garnet","gregtech:ore_yellow_limonite","gregtech:ore_zinc"
]

const ALL_ORES = [...vanillaOres, ...gregTechOres]

// ---------------------------
// Config general
// ---------------------------
const SEARCH_RADIUS = 64
const VIEWER_PORT = 3000
const ANTI_AFK_INTERVAL = 30000
let savedInventory = []

// ---------------------------
// Crear bot y reconectar
// ---------------------------
function createBot() {
  const bot = mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'MinerGT'
  })
  setupBot(bot)
}

function setupBot(bot) {
  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(toolPlugin)

  let mcData
  let defaultMove

  bot.once('spawn', async () => {
    console.log('✅ Bot conectado')
    mcData = require('minecraft-data')(bot.version)
    defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    // Viewer web
    viewer(bot, { port: VIEWER_PORT })

    // Restaurar inventario
    await restoreInventory(bot)

    // Iniciar minería y antiAFK
    mineLoop(bot)
    antiAFK(bot)
  })

  bot.on('end', () => {
    console.log('🔄 Bot desconectado, guardando inventario y reconectando...')
    saveInventory(bot)
    setTimeout(createBot, 5000)
  })

  bot.on('kicked', reason => console.log('🚫 Kickeado:', reason))
  bot.on('error', err => console.log('❌ Error:', err.message))
}

// ---------------------------
// Inventario
function saveInventory(bot) {
  savedInventory = bot.inventory.items().map(item => ({
    type: item.type,
    count: item.count,
    metadata: item.metadata
  }))
  writeInventoryFile(bot)
  console.log('💾 Inventario guardado')
}

async function restoreInventory(bot) {
  if (!savedInventory || savedInventory.length === 0) return
  for (const item of savedInventory) {
    try {
      if (bot.creative) await bot.give(item.type, item.count)
      else bot.chat(`/give ${bot.username} ${item.type} ${item.count}`)
    } catch(err) {
      console.log('⚠️ No se pudo restaurar item:', item, err.message)
    }
  }
  console.log('🔄 Inventario restaurado')
}

function writeInventoryFile(bot) {
  fs.writeFileSync('inventory.json', JSON.stringify(bot.inventory.items()), 'utf-8')
}

// ---------------------------
// Anti-AFK
function antiAFK(bot) {
  setInterval(() => {
    if (!bot.entity) return
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
    bot.setControlState('forward', true)
    setTimeout(() => bot.setControlState('forward', false), 1000)
    const yaw = Math.random() * Math.PI * 2
    const pitch = (Math.random() - 0.5) * 0.5
    bot.look(yaw, pitch, true)
  }, ANTI_AFK_INTERVAL)
}

// ---------------------------
// Minería principal con prioridad
async function mineLoop(bot) {
  while(true) {
    try {
      const target = findBestOre(bot)
      if(!target) {
        await randomWalk(bot)
        continue
      }
      await bot.pathfinder.goto(new GoalBlock(target.position.x, target.position.y, target.position.z))
      await bot.tool.equipForBlock(target)
      await bot.dig(target)
      logInventory(bot)
    } catch(err) {
      console.log('⚠️ Error en minería:', err.message)
    }
  }
}

// ---------------------------
// Prioridad por tamaño de veta y herramienta
function findBestOre(bot) {
  // Encontrar todos los bloques de ores dentro del radio
  const blocks = bot.findBlocks({
    matching: b => ALL_ORES.includes(b.name) && bot.canDigBlock(b),
    maxDistance: SEARCH_RADIUS,
    count: 100
  }).map(pos => bot.blockAt(pos))

  if(blocks.length === 0) return null

  // Agrupar por tipo para estimar tamaño de veta
  const oreGroups = {}
  for(const b of blocks) {
    oreGroups[b.name] = oreGroups[b.name] || []
    oreGroups[b.name].push(b)
  }

  // Ordenar primero por cantidad de bloques (veta más grande) luego por dificultad de minado
  const sortedGroups = Object.entries(oreGroups)
    .sort((a,b) => b[1].length - a[1].length) // tamaño de veta descendente
    .map(g => g[1])
    .flat()

  // Filtrar por herramienta capaz
  for(const b of sortedGroups) {
    if(bot.canDigBlock(b)) return b
  }

  return null
}

// ---------------------------
// Exploración
async function randomWalk(bot) {
  const pos = bot.entity.position
  const x = pos.x + (Math.random()*40-20)
  const z = pos.z + (Math.random()*40-20)
  const y = pos.y
  await bot.pathfinder.goto(new GoalBlock(x,y,z))
}

// ---------------------------
// Inventario
function logInventory(bot) {
  const items = bot.inventory.items()
  console.clear()
  console.log('\n📊 Inventario:')
  console.table(items.map(i=>({
    nombre: i.name,
    cantidad: i.count,
    slot: i.slot,
    fila: Math.floor(i.slot/9)
  })))
  writeInventoryFile(bot)
}

// ---------------------------
// Iniciar bot
createBot()
