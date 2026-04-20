export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).end();

  const { token } = req.body;
  const secret = process.env.HCAPTCHA_SECRET;

  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `response=${token}&secret=${secret}`
  });

  const data = await response.json();
  res.status(200).json({ success: data.success });
}
