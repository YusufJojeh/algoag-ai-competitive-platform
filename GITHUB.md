# رفع المشروع إلى GitHub

## 1. إنشاء المستودع على GitHub

1. اذهب إلى [github.com/new](https://github.com/new)
2. **Repository name:** مثلاً `algoag` أو `algorithm-design-assistant`
3. **Description:** Algorithm Design Assistant - Laravel, React, Inertia, Ollama
4. اختر **Public**
5. **لا** تضف README أو .gitignore أو License (المشروع جاهز محلياً)
6. اضغط **Create repository**

## 2. ربط المشروع المحلي ورفعه

في الطرفية من مجلد المشروع (`c:\xampp\htdocs\algoag`):

```bash
# استبدل YOUR_USERNAME و YOUR_REPO باسم المستخدم واسم المستودع
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# رفع الفرع main
git push -u origin main
```

أو باستخدام SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. إذا طُلب منك تسجيل الدخول

- عند استخدام HTTPS قد يطلب GitHub اسم المستخدم وكلمة مرور. استخدم **Personal Access Token** بدلاً من كلمة المرور.
- من GitHub: Settings → Developer settings → Personal access tokens → Generate new token.

بعد تنفيذ الأوامر أعلاه يكون المشروع كاملاً على GitHub.

---

## 4. طريقة واحدة بأمر (بعد تثبيت GitHub CLI)

تم تثبيت **GitHub CLI** (`gh`). إذا أكملت تسجيل الدخول في المتصفح (باستخدام الرمز الذي ظهر في الطرفية)، نفّذ من مجلد المشروع:

```powershell
& "${env:ProgramFiles}\GitHub CLI\gh.exe" repo create algoag --public --source=. --remote=origin --push
```

هذا ينشئ مستودعاً باسم `algoag` على حسابك ويضيف `origin` ويرفع الفرع `main` مباشرة.
