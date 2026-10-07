import type { CustomConfig } from '../types.ts'

const team: CustomConfig['team'] = {
  title: 'About the team',
  desc: 'The map is built by a mostly China-based team. Here are some of the people behind it.',
  heroAction: 'Learn more about the team',
  memberCard: {
    sponsor: 'Sponsor',
    profilePicture: 'Profile picture of {name}',
    projects: 'Projects',
    location: 'Location',
    languages: 'Languages',
    website: 'Website',
  },
  coreMember: {
    title: 'Core team members',
    desc: 'Core team members actively maintain one or more core projects over the long term. They have made major contributions to the Kongying Tavern ecosystem.',
  },
  emeritiMember: {
    title: 'Emeritus core team',
    desc: 'We honor former team members who made outstanding contributions and are no longer active.',
  },
  partnerMember: {
    title: 'Community partners',
    desc: 'We work closely with these key partners and often collaborate with them on upcoming features.',
  },
}

export default team
