(async () => {
  try {
    const eventsRes = await fetch('http://localhost:5001/api/events');
    const eventsData = await eventsRes.json();
    const eventId = eventsData.events[0]._id;

    const payload1 = {
      eventId,
      teamName: 'Concurrent Team 1',
      teamLeader: {
        fullName: 'Jane Doe',
        rollNumber: 'ROLL_C1',
        email: 'jane@college.edu',
        department: 'CSE',
        year: '3rd Year'
      },
      members: []
    };

    const payload2 = {
      eventId,
      teamName: 'Concurrent Team 2',
      teamLeader: {
        fullName: 'John Doe',
        rollNumber: 'ROLL_C2',
        email: 'johnc@college.edu',
        department: 'IT',
        year: '3rd Year'
      },
      members: []
    };

    console.log('Sending concurrent registrations...');
    const [res1, res2] = await Promise.all([
      fetch('http://localhost:5001/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1)
      }),
      fetch('http://localhost:5001/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2)
      })
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    console.log('Concurrent Team 1 ID:', data1.registration?.teamId, 'Success:', data1.success);
    console.log('Concurrent Team 2 ID:', data2.registration?.teamId, 'Success:', data2.success);

  } catch (err) {
    console.error(err);
  }
})();
