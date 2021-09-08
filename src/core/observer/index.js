/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 通过 Object.defineProperty 给 value 添加一个 _ob_ 属性 表明该对象已经通过 Observer 进行转换
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 处理 value 为 数组的情况
      // 当前 js 运行环境是否支持 __proto__ 这种语法
      if (hasProto) {
        // protoAugment 该方法用给数组原型进行扩展
        // arrayMethods 基于 Array.prototype 通过 Object.create() 创建的一个对象
        // value.__proto__ = arrayMthods
        // arrayMthods.__proto__ = Array.prototype
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // 处理 value 为对象
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {

  if (!isObject(value) || value instanceof VNode) {
    return
  }

  let ob: Observer | void
  // 如果 value 中有 _ob_ ，表明当前 value 已经通过 new Observer 生成了 ob 实例
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    // 只有 value 为数组或是普通对象才会进行处理。
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    // 判断 value 是否是 vue 实例， 如果是 vue 实例这不需要转换为响应式。
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 为data中每一个属性创建一个目标对象
  const dep = new Dep()

  // 获取obj对象 key属性的描述
  const property = Object.getOwnPropertyDescriptor(obj, key)

  // 如果获取不到描述或是该属性为不可配置则不将该属性转换为响应式
  if (property && property.configurable === false) {
    return
  }

  // 满足预定义 getter/setter 的情况
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set

  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 如果 data 中的属性为 {}, 继续调用 observe 将其转换为响应式对象
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        // 为当前访问的属性收集依赖
        dep.depend()
        // childOb 存在表示当前属性的值也是一个对象
        if (childOb) {
          // 为当前属性的值这个对象进行收集依赖
          // 举一个例子:
          /** 
           * data = {
           *  obj: {
           *  name: 'rebor'
           *    }
           * }
           * 
           * dep.depend()  为 obj 属性收集依赖， 当obj = 1 通知属性的watcher 更新视图
           * childOb.dep.depend() 为 {name: 'reborn'} 收集依赖，当 obj.name = 'molly' 通知watcher 更新视图
           * */ 
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 对 obj ： [] 这种情况进行处理
             // 遍历数据中的每一个元素，如果该元素也是一个 ob 对象，则也要为其进行依赖收集。
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val

      // 新设置的值不能为 NaN
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }

      // 自定义 setter
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }

      // #7981: for accessor properties without setter
      if (getter && !setter) return


      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 赋值时为一个新对象
      childOb = !shallow && observe(newVal)

      // 通知观察者进行更新视图
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  // 遍历数据中的每一个元素，如果该元素也是一个 ob 对象，则也要为其进行依赖收集。
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
