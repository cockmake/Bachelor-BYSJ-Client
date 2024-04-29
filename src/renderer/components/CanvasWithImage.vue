<script lang="ts" setup>
import {ref, onUnmounted, nextTick} from 'vue'

defineProps({
  fileUrl: String
})

const b_main_img = ref()
let box_block_canvas_list = []
nextTick(() => {
  window.addEventListener('resize', init_canvas)
  window.addEventListener('scroll', init_canvas)
})
onUnmounted(() => {
  console.log('组件销毁')
  window.removeEventListener('resize', init_canvas)
  window.removeEventListener('scroll', init_canvas)
  // 清空canvas
  for (let i = 0; i < box_block_canvas_list.length; i++) {
    document.body.removeChild(box_block_canvas_list[i])
  }
})

function set_canvas_position() {
  // 重置canvas的大小使其等同于图片的大小
  // canvas的top和left使其与图片重合
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  canvas.width = b_main_img.value.width
  canvas.height = b_main_img.value.height
  canvas.style.top = b_main_img.value.offsetTop + 'px'
  canvas.style.left = b_main_img.value.offsetLeft + 'px'
  return canvas
}

function init_canvas() {
  // 清空最上层的canvas
  reset_box_block_canvas()

  // 将结果绘制到canvas上
  const canvas = set_canvas_position()
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  // 字体颜色为橘黄色
  ctx.lineWidth = 2
  ctx.strokeStyle = 'red'
  ctx.font = '22px Arial'
  ctx.fillStyle = 'orange'

  for (let i = 0; i < boxes.length; i++) {
    // 绘制在z-index为1的canvas上
    let box = boxes[i]
    let logit = logits[i]  // 保留两位小数
    logit = logit.toFixed(2)
    let phrase = phrases[i]

    let x = box[0] * b_main_img.value.width
    let y = box[1] * b_main_img.value.height
    let w = box[2] * b_main_img.value.width
    let h = box[3] * b_main_img.value.height
    ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    ctx.fillText(phrase, x - w / 2 + 5, y - h / 2 - 5)
    ctx.fillText(logit, x - w / 2 + 5, y - h / 2 + 20)


    // 在该区域再生成一个z-index为2的canvas用于监听鼠标事件
    // 当鼠标进入的时候用半透明色块填充整个区域
    // 鼠标离开的时候清除绘制
    let box_block_canvas = document.createElement('canvas')
    box_block_canvas.width = w
    box_block_canvas.height = h
    box_block_canvas.style.position = 'absolute'
    box_block_canvas.style.top = y - h / 2 + b_main_img.value.offsetTop + 'px'
    box_block_canvas.style.left = x - w / 2 + b_main_img.value.offsetLeft + 'px'
    box_block_canvas.style.zIndex = '2'
    box_block_canvas.style.cursor = 'pointer'
    box_block_canvas.style.pointerEvents = 'auto'
    box_block_canvas.style.backgroundColor = 'rgba(113, 211, 242, 0.4)'
    box_block_canvas.style.borderRadius = '5px'
    // 鼠标进入的时候透明度变为0.8
    // 鼠标离开的时候透明度变为0.4
    box_block_canvas.onmouseenter = function () {
      box_block_canvas.style.backgroundColor = 'rgba(113, 211, 242, 0.8)'
    }
    box_block_canvas.onmouseleave = function () {
      box_block_canvas.style.backgroundColor = 'rgba(113, 211, 242, 0.4)'
    }
    document.body.appendChild(box_block_canvas)
    box_block_canvas_list.push(box_block_canvas)
  }
}

let boxes = []  // 归一化的数据  // 绘制方框时需要乘以图片的宽高
// 格式为center_x, center_y, width, height
let logits = []
let phrases = []

const canvas = ref()

function setBoxes(_boxes: any) {
  boxes = _boxes
}

function setLogits(_logits: any) {
  logits = _logits
}

function setPhrases(_phrases: any) {
  phrases = _phrases
}

function reset_box_block_canvas() {
  for (let i = 0; i < box_block_canvas_list.length; i++) {
    document.body.removeChild(box_block_canvas_list[i])
  }
  box_block_canvas_list = []
}

function set_result_and_init(_boxes: any, _logits: any, _phrases: any) {
  setBoxes(_boxes)
  setLogits(_logits)
  setPhrases(_phrases)
  init_canvas()
}

function resetResult() {
  // 清空结果
  boxes = []
  logits = []
  phrases = []

  // 清空box_block_canvas画布
  reset_box_block_canvas()

  // 清空画布
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.clearRect(0, 0, canvas.width, canvas.height)

}

defineExpose({
  init_canvas, setBoxes, setLogits, setPhrases, set_result_and_init, resetResult
})
</script>

<template>
  <div class="b-main-image">
    <img
        ref="b_main_img"
        style="max-height: 100%; max-width: 100%; object-fit: contain;"
        alt="请选择你的图片"
        :src="fileUrl">
    <canvas class="b-main-canvas" id="canvas"></canvas>
  </div>
</template>

<style scoped>
.b-main-image {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.b-main-canvas {
  z-index: 1;
  position: absolute;
}
</style>