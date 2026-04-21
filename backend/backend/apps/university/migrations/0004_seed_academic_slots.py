from django.db import migrations


def seed_academic_slots(apps, schema_editor):
    AcademicSlot = apps.get_model('university', 'AcademicSlot')

    slots = [
        {
            'subject': 'Mathematics I',
            'day': 'MON',
            'time_slot': '09:00-10:15',
            'teacher': 'Dr. Alan Smith',
        },
        {
            'subject': 'Physics Fundamentals',
            'day': 'MON',
            'time_slot': '10:30-11:45',
            'teacher': 'Dr. Emily Clark',
        },
        {
            'subject': 'Computer Science Basics',
            'day': 'TUE',
            'time_slot': '09:00-10:15',
            'teacher': 'Prof. Michael Johnson',
        },
        {
            'subject': 'Academic Writing',
            'day': 'TUE',
            'time_slot': '10:30-11:45',
            'teacher': 'Prof. Sarah Lee',
        },
        {
            'subject': 'Introduction to Economics',
            'day': 'WED',
            'time_slot': '09:00-10:15',
            'teacher': 'Dr. Robert Brown',
        },
        {
            'subject': 'World History',
            'day': 'WED',
            'time_slot': '10:30-11:45',
            'teacher': 'Dr. Olivia Davis',
        },
        {
            'subject': 'Data Structures',
            'day': 'THU',
            'time_slot': '09:00-10:15',
            'teacher': 'Prof. Daniel Wilson',
        },
        {
            'subject': 'Linear Algebra',
            'day': 'THU',
            'time_slot': '10:30-11:45',
            'teacher': 'Dr. Sophia Martinez',
        },
        {
            'subject': 'English Communication',
            'day': 'FRI',
            'time_slot': '09:00-10:15',
            'teacher': 'Prof. James Anderson',
        },
        {
            'subject': 'Software Engineering',
            'day': 'FRI',
            'time_slot': '10:30-11:45',
            'teacher': 'Dr. Mia Thompson',
        },
    ]

    for slot in slots:
        AcademicSlot.objects.get_or_create(
            subject=slot['subject'],
            day=slot['day'],
            time_slot=slot['time_slot'],
            teacher=slot['teacher'],
        )


def unseed_academic_slots(apps, schema_editor):
    AcademicSlot = apps.get_model('university', 'AcademicSlot')
    subjects = [
        'Mathematics I',
        'Physics Fundamentals',
        'Computer Science Basics',
        'Academic Writing',
        'Introduction to Economics',
        'World History',
        'Data Structures',
        'Linear Algebra',
        'English Communication',
        'Software Engineering',
    ]
    AcademicSlot.objects.filter(subject__in=subjects).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('university', '0003_delete_major'),
    ]

    operations = [
        migrations.RunPython(seed_academic_slots, unseed_academic_slots),
    ]
