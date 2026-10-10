(async () => {
  try {
    const eventsRes = await fetch('http://localhost:5001/api/events');
    const eventsData = await eventsRes.json();
    const eventId = eventsData.events[0]._id;
    console.log('Event ID:', eventId);

    const payload = {
      eventId,
      teamName: 'Test Team Auto',
      teamLeader: {
        fullName: 'John Doe',
        rollNumber: 'ROLL' + Date.now(),
        email: 'john@college.edu',
        department: 'CSE',
        year: '3rd Year'
      },
      members: []
    };

    console.log('Sending first registration...');
    let res1 = await fetch('http://localhost:5001/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    let data1 = await res1.json();
    if (res1.ok) {
        console.log('First Team ID:', data1.registration.teamId);
    } else {
        console.error('Error 1:', data1);
    }

    payload.teamLeader.rollNumber = 'ROLL' + Date.now() + '2';
    console.log('Sending second registration...');
    let res2 = await fetch('http://localhost:5001/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    let data2 = await res2.json();
    if (res2.ok) {
        console.log('Second Team ID:', data2.registration.teamId);
    } else {
        console.error('Error 2:', data2);
    }
  } catch (err) {
    console.error(err);
  }
})();
