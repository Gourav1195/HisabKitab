export const formatDateTime = (ts: number) => {
    const d = new Date(ts);

    const date = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
    });

    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });

    const todayIST = new Date();
    const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const istToday = new Date(todayIST.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    const isSameDay =
        istDate.getFullYear() === istToday.getFullYear() &&
        istDate.getMonth() === istToday.getMonth() &&
        istDate.getDate() === istToday.getDate();

    if (isSameDay) return `Today · ${time}`;

    return `${date} · ${time}`;
};

