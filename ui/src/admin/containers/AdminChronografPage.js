import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {loadUsersAsync} from 'src/admin/actions/chronograf'

import Authorized, {SUPERADMIN_ROLE} from 'src/auth/Authorized'

import PageHeader from 'src/admin/components/chronograf/PageHeader'
import UsersTableHeader from 'src/admin/components/chronograf/UsersTableHeader'
import UsersTable from 'src/admin/components/chronograf/UsersTable'
import BatchActionsBar from 'src/admin/components/chronograf/BatchActionsBar'
import ManageOrgsOverlay from 'src/admin/components/chronograf/ManageOrgsOverlay'
import CreateUserOverlay from 'src/admin/components/chronograf/CreateUserOverlay'

import FancyScrollbar from 'shared/components/FancyScrollbar'

import {
  DUMMY_ORGS,
  DEFAULT_ORG,
  NO_ORG,
  USER_ROLES,
  MOAR_DUMMY_ORGS,
} from 'src/admin/constants/dummyUsers'

class AdminChronografPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // TODO: pass around organization object instead of just name
      organizationName: this.props.currentOrganization.name,
      selectedUsers: [],
      filteredUsers: this.props.users,
      showManageOverlay: false,
      showCreateUserOverlay: false,
    }
  }

  // TODO: revisit this, possibly don't call setState if both are deep equal
  componentWillReceiveProps(nextProps) {
    const {users, currentOrganization} = nextProps

    this.handleFilterUsers({
      name: currentOrganization.name,
      users,
    })
  }

  componentDidMount() {
    const {loadUsers} = this.props

    // TODO: determine this url from server
    const urlThatsProbablySourceLinksUsersChronograf = '/chronograf/v1/users'
    loadUsers(urlThatsProbablySourceLinksUsersChronograf)
  }

  isSameUser = (userA, userB) => {
    return (
      userA.name === userB.name &&
      userA.provider === userB.provider &&
      userA.scheme === userB.scheme
    )
  }

  handleFilterUsers = ({users, name}) => {
    const nextUsers = users || this.props.users
    const nextOrganizationName = name || this.props.currentOrganization.name

    const filteredUsers =
      nextOrganizationName === DEFAULT_ORG
        ? nextUsers
        : nextUsers.filter(
            user =>
              nextOrganizationName === NO_ORG
                ? user.roles.length === 1 // Filter out if user is only part of Default Org
                : user.roles.find(
                    role => role.organizationName === nextOrganizationName
                  )
          )
    this.setState({
      filteredUsers,
      organizationName: nextOrganizationName,
      selectedUsers:
        nextOrganizationName === DEFAULT_ORG ? this.state.selectedUsers : [],
    })
  }

  handleToggleUserSelected = user => e => {
    e.preventDefault()

    const {selectedUsers} = this.state

    const isUserSelected = selectedUsers.find(u => this.isSameUser(user, u))

    const newSelectedUsers = isUserSelected
      ? selectedUsers.filter(u => !this.isSameUser(user, u))
      : [...selectedUsers, user]

    this.setState({selectedUsers: newSelectedUsers})
  }

  handleToggleAllUsersSelected = areAllSelected => () => {
    const {filteredUsers} = this.state

    if (areAllSelected) {
      this.setState({selectedUsers: []})
    } else {
      this.setState({selectedUsers: filteredUsers})
    }
  }

  handleBatchDeleteUsers = () => {}
  handleBatchRemoveOrgFromUsers = () => {}
  handleBatchAddOrgToUsers = () => {}
  handleBatchChangeUsersRole = () => {}

  handleUpdateUserRole = () => (_user, _currentRole, _newRole) => {}

  handleShowManageOrgsOverlay = () => {
    this.setState({showManageOverlay: true})
  }

  handleShowCreateUserOverlay = () => {
    this.setState({showCreateUserOverlay: true})
  }

  handleHideOverlays = () => {
    this.setState({showManageOverlay: false, showCreateUserOverlay: false})
  }

  handleCreateOrganization = _organizationName => {}
  handleDeleteOrganization = _organization => {}
  handleRenameOrganization = (_organization, _newOrgName) => {}

  handleCreateUser = _newUser => {}

  render() {
    const {users, organizations} = this.props
    const {
      organizationName,
      selectedUsers,
      filteredUsers,
      showManageOverlay,
      showCreateUserOverlay,
    } = this.state

    const numUsersSelected = Object.keys(selectedUsers).length

    return (
      <div className="page">
        <PageHeader
          onShowManageOrgsOverlay={this.handleShowManageOrgsOverlay}
          onShowCreateUserOverlay={this.handleShowCreateUserOverlay}
        />

        <FancyScrollbar className="page-contents">
          {users
            ? <div className="container-fluid">
                <div className="row">
                  <div className="col-xs-12">
                    <div className="panel panel-minimal">
                      <UsersTableHeader
                        organizationName={organizationName}
                        organizations={organizations}
                        onFilterUsers={this.handleFilterUsers}
                      />
                      <BatchActionsBar
                        numUsersSelected={numUsersSelected}
                        organizationName={organizationName}
                        organizations={organizations}
                        onDeleteUsers={this.handleBatchDeleteUsers}
                        onAddOrgs={this.handleBatchAddOrgToUsers}
                        onRemoveOrgs={this.handleBatchRemoveOrgFromUsers}
                        onChangeRoles={this.handleBatchChangeUsersRole}
                      />
                      <div className="panel-body chronograf-admin-table--panel">
                        <Authorized
                          requiredRole={SUPERADMIN_ROLE}
                          propsOverride={{organizationName}}
                        >
                          <UsersTable
                            filteredUsers={filteredUsers} // TODO: change to users upon separating Orgs & Users views
                            organizationName={organizationName}
                            onFilterUsers={this.handleFilterUsers}
                            onToggleUserSelected={this.handleToggleUserSelected}
                            selectedUsers={selectedUsers}
                            isSameUser={this.isSameUser}
                            onToggleAllUsersSelected={
                              this.handleToggleAllUsersSelected
                            }
                            onUpdateUserRole={this.handleUpdateUserRole()}
                          />
                        </Authorized>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            : <div className="page-spinner" />}
        </FancyScrollbar>
        {showManageOverlay
          ? <ManageOrgsOverlay
              onDismiss={this.handleHideOverlays}
              onCreateOrg={this.handleCreateOrganization}
              onDeleteOrg={this.handleDeleteOrganization}
              onRenameOrg={this.handleRenameOrganization}
              organizations={MOAR_DUMMY_ORGS}
            />
          : null}
        {showCreateUserOverlay
          ? <CreateUserOverlay
              onDismiss={this.handleHideOverlays}
              onCreateUser={this.handleCreateUser}
              userRoles={USER_ROLES}
              organizations={MOAR_DUMMY_ORGS}
            />
          : null}
      </div>
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

AdminChronografPage.propTypes = {
  users: arrayOf(shape),
  currentOrganization: shape({
    id: string.isRequired,
    name: string.isRequired,
  }).isRequired,
  organizations: arrayOf(shape),
  loadUsers: func.isRequired,
}

AdminChronografPage.defaultProps = {
  organizations: DUMMY_ORGS,
}

const mapStateToProps = ({
  adminChronograf: {users},
  auth: {me: {currentOrganization}},
}) => ({
  users,
  currentOrganization,
})

const mapDispatchToProps = dispatch => ({
  loadUsers: bindActionCreators(loadUsersAsync, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(AdminChronografPage)