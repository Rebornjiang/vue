/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'


export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  // 对 Vue.config 属性进行数据劫持
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }

  // 初始化 Vue.config 对象, 在 runtime/index.js 有给 Vue.config 对象里面添加一些方法
  Object.defineProperty(Vue, 'config', configDef)

  // 给 Vue 增加 util 对象，里面是 要使用的工具发给发
  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露工具方法，这些方法不是公共 API ，除非你意识到风险，否则应该避免依赖他们。
  // warn 用于生成 Vue 警告信息 与 tip 
  // extend 用于对象的浅拷贝
  // mergeOptions ？将两个选项对象合并为 一个新对象。
  // defineReactive 用于给一个对象的某个属性定义响应式
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 静态方法， 分析响应式之后再来看
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 让一个对象成为响应式
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }


  // 初始化 Vue.options 对象，并给其扩展
  // components， directives，filters属性
  // 应该是用于存储所有的全局 components， directives，filters  RJ
  
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
  
  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 给 options 添加了 _base 属性用于记录 Vue
  Vue.options._base = Vue

  // 将 全局组件 keep-alive 添加到 Vue.options.components 里面
  extend(Vue.options.components, builtInComponents)

  // 给 Vue 挂载 use 方法， 注册插件
  initUse(Vue)
  // 给 Vue 挂载 Mixin 方法， 混入
  initMixin(Vue)
  // 给 Vue 挂载 extend 方法， 使用基础 Vue 构造器，创建一个“子类” 的 Vue
  // 子类的prototype.prototype = Vue.prototype
  // 具有 Vue 的方法。用于创建 编程式组件（项 element-ui 种 message 组件）
  initExtend(Vue)
  // 给 Vue 挂载 component , directive , filter 方法 
  initAssetRegisters(Vue)
}
