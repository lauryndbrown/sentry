import styled from 'react-emotion';
import React from 'react';
import createReactClass from 'create-react-class';

import BookmarkStar from 'app/components/projects/bookmarkStar';
import Link from 'app/components/links/link';
import ProjectLabel from 'app/components/projectLabel';
import SentryTypes from 'app/sentryTypes';
import space from 'app/styles/space';

const ProjectItem = createReactClass({
  displayName: 'ProjectItem',

  propTypes: {
    project: SentryTypes.Project,
    organization: SentryTypes.Organization,
  },

  getInitialState() {
    return {
      isBookmarked: this.props.project.isBookmarked,
    };
  },

  handleToggleBookmark(isBookmarked) {
    this.setState({isBookmarked});
  },

  render() {
    const {project, organization} = this.props;

    return (
      <Container key={project.id}>
        <BookmarkLink
          organization={organization}
          project={project}
          isBookmarked={this.state.isBookmarked}
          onToggle={this.handleToggleBookmark}
        />
        <Link to={`/settings/${organization.slug}/projects/${project.slug}/`}>
          <ProjectLabel project={project} />
        </Link>
      </Container>
    );
  },
});

const Container = styled('div')`
  display: flex;
  align-items: center;
`;

const BookmarkLink = styled(BookmarkStar)`
  margin-right: ${space(1)};
  margin-top: -${space(0.25)};
`;

export default ProjectItem;
