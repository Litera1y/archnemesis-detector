import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs'
import _ from 'lodash'
import nodeCanvas from 'canvas'

const SOURCE_URL = 'https://poedb.tw/kr/Archnemesis_league#Mods'
const DESTINATION = 'src/assets/poedb.json'
const INVENTORY_BACKGROUND_COLOR = '#07071f'

const TIERS = {
  'item_common': 0,
  'item_magic': 1,
  'item_rare': 2,
  'item_unique': 3
}

const transformName = _.kebabCase

const srcToDataUrl = async (src) => {
  const image = await nodeCanvas.loadImage(src)

  const canvas = nodeCanvas.createCanvas(image.width, image.height)

  const ctx = canvas.getContext('2d')

  ctx.rect(0, 0, image.width, image.height)
  ctx.fillStyle = INVENTORY_BACKGROUND_COLOR
  ctx.fill()
  ctx.drawImage(image, 0, 0)

  return ctx.canvas.toDataURL()
}

const response = await fetch(SOURCE_URL)
const html = await response.text()
const $ = cheerio.load(html)

const result = []

const rows = $('#ArchnemesisArchnemesisMods > div.table-responsive > table > tbody > tr').toArray()

for(const row of rows) {
  const $tr = $(row)

  const imgSrc = $tr.find('td:nth-child(1) img').attr('src')

  const nameNode = $tr.find('td:nth-child(1) a[class^=item]')

  const tier = TIERS[nameNode.attr('class')]

  const name = nameNode.text()

  let rewards = []
  $tr.find('td:nth-child(2) .currency').each((_i, ccy) => {
    rewards.push($(ccy).text())
  })

  let recipe = []
  $tr.find('td:nth-child(3) a[class^=item]').each((_i, part) => {
    recipe.push(transformName($(part).text()))
  })

  result.push({
    id: transformName(name),
    name,
    tier,
    icon: await srcToDataUrl(imgSrc),
    rewards,
    recipe
  })
}

fs.writeFileSync(DESTINATION, JSON.stringify(result))
