export const askAnju = async (userMessage: string) => {
  try {
    const response = await fetch('10.141.216.110', {
  method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    return data.reply; // assuming backend returns { reply: "..." }
  } catch (error) {
    console.error('Anju API Error:', error);
    return 'Oops! Anju is sleeping. Try again later.';
  }
}