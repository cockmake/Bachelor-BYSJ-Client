<script lang="ts" setup>
import {reactive, ref} from "vue";
import {Delete, Download, Platform, Plus, ZoomIn} from '@element-plus/icons-vue'
import LabelForOneImage from "../components/LabelForOneImage.vue";
import {UploadUserFile} from 'element-plus'
import JSZip from "jszip";
import {showNotification} from "../utils";

const classes = ref({
  'object': {
    show: true,
    color: 'orange',
  }
})

const get_label_count = (index) => {
  let count = 0
  for (let key in image_labels.value[current_file_uid.value].labels[index]) {
    count += 1
  }
  return count
}
const image_labels = ref({})

const dialogImageUrl = ref('')
const dialogVisible = ref(false)

const current_file = ref<UploadUserFile | null>(null)
const current_file_uid = ref(0)
const handleLabel = (uploadFile: any) => {
  current_file.value = null
  current_file.value = uploadFile
  current_file_uid.value = uploadFile.uid
}
const handleExport = (uploadFile: any) => {
  const file_uid = uploadFile.uid
  // 导出该文件的标注信息
  const label_info = image_labels.value[file_uid]
  // 先统计该标注文件中的类别数量和对应的index
  let index = 0
  let class_set = {}
  for (let key in classes.value){
    class_set[key] = index
    index += 1
  }
  console.log(class_set)
  // 生成标注文件
  let label_file = ''
  for (let i = 0; i < 2; i++) {
    for (let key in label_info.labels[i]) {
      const label = label_info.labels[i][key]
      label_file += `${class_set[label.phrases]}\t${label.boxes[0]}\t${label.boxes[1]}\t${label.boxes[2]}\t${label.boxes[3]}\n`
    }
  }
  // 生成类别文件
  let class_file = ''
  for (let key in class_set) {
    class_file += `${class_set[key]}\t${key}\n`
  }

  const label_blob = new Blob([label_file], {type: 'text/plain'})
  const class_blob = new Blob([class_file], {type: 'text/plain'})
  const zip = new JSZip();
  zip.file(uploadFile.name.split('.')[0] + '_' + uploadFile.uid + '.txt', label_blob);
  zip.file('class.txt', class_blob);

  zip.generateAsync({type: 'blob'}).then(function (content) {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = '标注文件' + '.zip';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('成功', '文件生成成功。', 'success', 2000, true, 'top-right')

  });
}
const exportAll = () => {
  if (fileList.value.length === 0) {
    showNotification('错误', '没有文件可以导出。', 'error', 2000, true, 'top-left')
    return
  }
  const zip = new JSZip();
  // 获取classes所有的类别
  let index = 0
  let class_set = {}
  for (let key in classes.value){
    class_set[key] = index
    index += 1
  }
  // 生成类别文件
  let class_file = ''
  for (let key in class_set) {
    class_file += `${class_set[key]}\t${key}\n`
  }
  const class_blob = new Blob([class_file], {type: 'text/plain'})
  zip.file('class.txt', class_blob);
  // 对于列表中的每一个文件，生成标注文件
  for (let file of fileList.value) {
    const file_uid = file.uid
    const label_info = image_labels.value[file_uid]
    let label_file = ''
    for (let i = 0; i < 2; i++) {
      for (let key in label_info.labels[i]) {
        const label = label_info.labels[i][key]
        label_file += `${class_set[label.phrases]}\t${label.boxes[0]}\t${label.boxes[1]}\t${label.boxes[2]}\t${label.boxes[3]}\n`
      }
    }
    const label_blob = new Blob([label_file], {type: 'text/plain'})
    zip.file(file.name.split('.')[0] + '_' + file_uid + '.txt', label_blob);
  }
  zip.generateAsync({type: 'blob'}).then(function (content) {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = '标注文件_全部' + '.zip';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('成功', '文件生成成功。', 'success', 2000, true, 'top-right')
  });
}
const fileList = ref<UploadUserFile[]>([])
const handleRemove = (uploadFile: any) => {
  if (current_file_uid.value === uploadFile.uid) {
    showNotification('警告', '当前文件正在被标注。', 'warning', 2000, true, 'top-left')
    return
  }
  fileList.value.splice(fileList.value.indexOf(uploadFile), 1)
  delete image_labels.value[uploadFile.uid]
}

const handlePictureCardPreview = (uploadFile: any) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}
const handleChange = (uploadFile: any) => {
  // 只有这个是Raw类型的
  // 其他三个Handle处理的都是Proxy[Object]类型的
  if (uploadFile.status === 'ready') {
    image_labels.value[uploadFile.uid] = reactive({
      prompt: '',
      p_box_threshold: 0.3,
      p_text_threshold: 0.2,

      labels: [{}, {}],
    })
  }
}

function outputList() {
  console.log(fileList.value)
  console.log(image_labels.value)
}

const deleteAll = () => {
  current_file.value = null
  current_file_uid.value = 0
  fileList.value = []
  image_labels.value = {}
}
const set_value_dialog_visible = ref(false)
let set_value = reactive({
  prompt: '',
  p_box_threshold: 0.3,
  p_text_threshold: 0.2,
})
const setAll = () => {
  set_value_dialog_visible.value = true
}
const setAllConfirm = () => {
  for (let key in image_labels.value) {
    image_labels.value[key].prompt = set_value.prompt
    image_labels.value[key].p_box_threshold = set_value.p_box_threshold
    image_labels.value[key].p_text_threshold = set_value.p_text_threshold
  }
  set_value_dialog_visible.value = false
}

</script>

<template>
  <div class="common-layout a">
    <el-container class="b">
      <el-aside class="b-aside">
        <div class="b-aside-upload-box">
          <el-upload
              v-model:file-list="fileList"
              :auto-upload="false"
              :on-change="handleChange"
              accept="image/*"
              list-type="picture-card"
              multiple>
            <template #file="{ file }">
              <div style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center">
                <img :src="file.url" alt="" class="el-upload-list__item-thumbnail" style=""/>
                <span class="el-upload-list__item-actions">
                <el-tooltip content="标注" placement="top">
                  <span
                      class="el-upload-list__item-delete"
                      @click="handleLabel(file)">
                    <el-icon><Platform/></el-icon>
                  </span>
                </el-tooltip>
                <el-tooltip content="导出" placement="top">
                  <span
                      class="el-upload-list__item-delete"
                      @click="handleExport(file)">
                    <el-icon><Download/></el-icon>
                  </span>
                </el-tooltip>
                <el-tooltip content="预览" placement="top">
                  <span
                      class="el-upload-list__item-preview"
                      @click="handlePictureCardPreview(file)">
                    <el-icon><ZoomIn/></el-icon>
                  </span>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <span
                      class="el-upload-list__item-delete"
                      @click="handleRemove(file)">
                    <el-icon><Delete/></el-icon>
                  </span>
                </el-tooltip>
            </span>
              </div>
            </template>
            <el-icon>
              <Plus/>
            </el-icon>
          </el-upload>
        </div>
        <el-divider></el-divider>
        <div
            style="display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center;">
          <el-button type="danger" @click="deleteAll">全部删除</el-button>
          <el-button type="primary" @click="setAll">批量设置</el-button>
          <el-button type="success" @click="exportAll">全部导出</el-button>
          <el-button type="info" @click="outputList">查看信息</el-button>
          <el-tag style="margin-top: 5px" v-if="current_file_uid">
            当前文件标注个数：{{ get_label_count(0) + get_label_count(1) }}
          </el-tag>
        </div>
      </el-aside>
      <el-main class="b-main">
        <LabelForOneImage
            v-if="current_file"
            :key="current_file.uid"
            :image_file="current_file"
            :image_label="image_labels[current_file.uid]"
            :classes="classes"/>
      </el-main>
    </el-container>
    <el-dialog v-model="set_value_dialog_visible" title="批量属性设置" width="50%" draggable>
      <div style="width: 100%">
        <el-form v-model="set_value"
                 label-width="auto"
                 style=" width: 100%; display: flex; flex-direction: column;">
          <el-form-item label="提示语">
            <el-input
                v-model="set_value.prompt"
                style="width: 100%"
                :autosize="{ minRows: 4, maxRows: 6 }"
                type="textarea"
                placeholder="请输入目标提示词，例如：&#10people in white.&#10black-haired cat.&#10The dog on the far left."/>
          </el-form-item>
          <el-form-item label="Box阈值">
            <el-input-number v-model="set_value.p_box_threshold" :min="0" :max="1" :step="0.01"/>
          </el-form-item>
          <el-form-item label="Text阈值">
            <el-input-number v-model="set_value.p_text_threshold" :min="0" :max="1" :step="0.01"/>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="set_value_dialog_visible = false">取消</el-button>
          <el-button type="primary" @click="setAllConfirm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="dialogVisible"
               destroy-on-close
               show-close
               width="50%">
      <div style="display: flex; align-items: center; justify-content: center;">
        <el-image :src="dialogImageUrl" fit="contain"/>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.a {
  height: 100%;
  width: 100%;
}

.b {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.b-aside {
  padding: 0;
  margin: 0;
  background: aliceblue;
  width: 38%;
  min-width: 400px;
  max-width: 490px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  .b-aside-upload-box {
    max-height: 80%;
    overflow-y: scroll;
    overflow-x: hidden;
  }
}

.b-main {
  padding: 0;
  margin-left: 5px;
  min-width: 800px;
}
</style>