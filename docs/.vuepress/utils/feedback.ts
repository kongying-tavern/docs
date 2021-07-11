function Tucao(data: object = {}, productId = '321980') {
  /**
   * 发起接入请求
   * @param  {[Object]} data     需要传递的用户信息
   * @param  {Number} productId  需要接入产品 id
   */
  const form = document.createElement('form')
  form.id = 'form'
  form.name = 'form'
  document.body.appendChild(form)

  // 设置相应参数
  for (const key in data) {
    const input = document.createElement('input')
    input.type = 'text'
    input.name = key
    input.value = data[key]
    // 将该输入框插入到 form 中
    form.appendChild(input)
  }
  // form 的提交方式
  form.method = 'POST'
  // form 提交路径
  form.action = 'https://support.qq.com/product/' + productId
  // 对该 form 执行提交
  form.submit()
  // 删除该 form
  document.body.removeChild(form)
}

function getUserLoginInfo() {
  if (!localStorage.getItem('user')) return {}
  const { id, name, avatar_url } = JSON.parse(
    window.localStorage.getItem('user')!
  )

  return {
    openid: id,
    nickname: name,
    avatar: avatar_url,
  }
}

export const feedback = () => {
  Tucao(getUserLoginInfo())
}
