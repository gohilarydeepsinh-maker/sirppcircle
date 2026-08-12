# Study Hub Elite

MASTER PROMPT — BUILD THE COMPLETE COLLEGE STUDY MATERIAL APP FROM ZERO



IMPORTANT:

This is a BRAND-NEW application.



Do not assume any previous project, previous code, previous database, previous authentication or previous UI exists.



Build the COMPLETE application from scratch.



Do not create a visual prototype.

Do not create fake buttons.

Do not create fake authentication.

Do not create fake uploads.

Do not leave important features as placeholders.



The application must actually work end-to-end with Supabase.



Before considering the project complete, test every major flow described below.



============================================================

1. APP PURPOSE

============================================================



This is a private study-material application for ONE COLLEGE.



The purpose is to allow college students to easily access study material shared by students/admins.



Example:



A teacher teaches a topic.

One student completes the work.

That student can upload the document if they have Captain permission.

Admin can approve it.

Other students can then find and use the material.



The app is primarily for STUDENTS.



The student experience must be extremely simple.



Main academic structure:



SEMESTER

    ↓

SUBJECT

    ↓

UNIT

    ↓

TOPIC

    ↓

DOCUMENTS



============================================================

2. DESIGN PHILOSOPHY

============================================================



The application must look PREMIUM but SIMPLE.



It must NOT look like:



- A cheap/local website

- A generic college project

- A basic CRUD dashboard

- A Bootstrap template

- An over-designed glassmorphism website



Use a simple professional academic colour system.



Use a small number of colours.



Prioritize:



- Excellent spacing

- Typography

- Clean cards

- Consistent icons

- Premium shadows

- Rounded corners

- Strong visual hierarchy

- Smooth transitions

- Simple layouts



The app must be STUDENT FRIENDLY.



A student should immediately understand:



Where to go

How to find a subject

How to find a topic

How to open a document

How to download it



Do not overload the student interface.



============================================================

3. NAVIGATION BAR

============================================================



Use a premium floating bottom navigation.



IMPORTANT:



Do NOT make the entire app glassmorphic.



Only the navigation should have a liquid-inspired appearance.



Navigation design:



- Blue blurred background

- Liquid-like soft blur

- Slight translucency

- Rounded floating shape

- Soft shadow

- Subtle border

- Premium active indicator

- Smooth icon animation



It should feel inspired by modern mobile operating systems.



Do not make it visually complicated.



STUDENT NAVIGATION:



Home

Browse

Profile



CAPTAIN NAVIGATION:



Home

Browse

Upload

Profile



ADMIN:



Admin Dashboard navigation



OWNER:



Owner/Admin management navigation



The navigation must work on mobile and desktop.



============================================================

4. AUTHENTICATION — REAL, NOT MOCK

============================================================



Use Supabase Auth.



There are four application roles:



1. STUDENT

2. CAPTAIN

3. ADMIN

4. OWNER



Authority:



OWNER >= ADMIN > CAPTAIN > STUDENT



Authentication methods:



STUDENT:

Google OAuth



CAPTAIN:

Google OAuth



OWNER:

Google OAuth



ADMIN:

Admin ID + Password



Do NOT call it Staff Login.



The UI label must be:



ADMIN LOGIN



============================================================

5. FIRST APP OPEN

============================================================



When a user opens the application:



First check Supabase authentication session.



IF there is a valid session:



    Load the user's profile.

    Determine the role.

    Open the correct application experience.



IF there is no valid session:



    Show the public Welcome/Login screen.



Welcome screen should contain:



- College app branding

- Short explanation

- Continue with Google

- Admin Login



Do NOT create a separate Student username/password system.



============================================================

6. STUDENT GOOGLE LOGIN

============================================================



Student login must use REAL Supabase Google OAuth.



Flow:



Open App

↓

Continue with Google

↓

Google OAuth

↓

Supabase authentication

↓

Authentication successful

↓

Find profile using authenticated user ID

↓

Does profile exist?



IF NO:



Show:



"Complete Your Profile"



Fields:



Student Name

Subject

Roll Number



Only these student details are required.



Then:



Save

↓

Create profile in Supabase

↓

Set role = student

↓

Open Home



IF YES:



Open Home directly.



Do NOT ask the profile questions again.



============================================================

7. SIGN UP

============================================================



There is no separate Student password signup.



Google first login automatically acts as the student's account creation.



Therefore:



Continue with Google

=

Login for existing user

+

Signup for new user



Do not create fake email/password signup for students.



============================================================

8. LOGOUT

============================================================



Every authenticated user must have a real Sign Out action.



When Sign Out is pressed:



Supabase session is terminated

↓

Local session cleared

↓

Return to Welcome/Login screen



============================================================

9. SESSION PERSISTENCE

============================================================



If the user closes and reopens the app:



Check Supabase session.



If valid:



Do not ask them to login again.



If session expired:



Return to Login.



============================================================

10. ADMIN LOGIN

============================================================



Create a separate:



ADMIN LOGIN



screen.



Fields:



Admin ID

Password



Initial Admin credentials:



Admin ID:

3024



Password:

3024302



IMPORTANT:



Do NOT expose the password in frontend code.



Do NOT place the password in public JavaScript.



Do NOT display it anywhere after configuration.



Use secure authentication.



After successful authentication:



Validate credentials

↓

Authenticate Admin

↓

Verify role = admin

↓

Open Admin Dashboard



Wrong credentials:



Show:

"Invalid Admin ID or Password"



Do not open the Admin Dashboard.



============================================================

11. OWNER

============================================================



Owner account:



gohilarydeepsinh@gmail.com



Owner authenticates through Google.



After Google authentication:



Check authenticated account/profile.



If this account is the authorized Owner account:



role = owner



Owner authority:



OWNER >= ADMIN



Owner can do everything Admin can do.



Owner additionally can:



- Manage Admins

- Manage roles

- Manage application settings

- Manage all users

- Manage all academic content

- Manage all documents

- Override normal Admin management actions



IMPORTANT:



Do NOT create a hidden frontend backdoor.



Do NOT use a secret URL.



Do NOT use a hidden password.



Owner access must be a legitimate protected role in the database/backend.



Normal users must NOT see Owner status or Owner permissions.



============================================================

12. OWNER + NORMAL STUDENT EXPERIENCE

============================================================



When Owner logs in:



The Owner must ALSO be able to use the normal student-facing application.



Owner should be able to:



- Home

- Browse

- Filter

- Open documents

- Download documents

- Profile



At the same time, Owner has protected Owner management access.



Do not expose the Owner role publicly.



============================================================

13. STUDENT ROLE

============================================================



Student is a normal read-only user.



Student can:



- Login with Google

- Complete profile

- View Home

- Browse

- Filter

- View Semesters

- View Subjects

- View Units

- View Topics

- Open approved documents

- View PDFs/images

- Download approved documents

- View/edit permitted profile information

- Logout



Student CANNOT:



- Upload documents

- Delete documents

- Edit documents

- Approve documents

- Reject documents

- Manage users

- Manage Captains

- Manage Admins

- Manage roles

- Add semesters

- Remove semesters

- Add subjects

- Remove subjects

- Add units

- Remove units

- Add topics

- Remove topics

- Access Admin Dashboard

- Access Owner Dashboard



There must be NO Upload button in the Student interface.



============================================================

14. CAPTAIN ROLE

============================================================



Captain is a Student with exactly ONE additional permission:



DOCUMENT UPLOAD.



Admin can promote:



Student → Captain



Admin can also revoke:



Captain → Student



Captain can:



- Do everything a Student can do

- Upload study documents



Captain CANNOT:



- Manage users

- Manage roles

- Manage semesters

- Manage subjects

- Manage units

- Manage topics

- Approve documents

- Reject documents

- Delete other users' documents

- Access Admin Dashboard

- Access Owner Dashboard

- Manage application settings



Captain navigation:



Home

Browse

Upload

Profile



============================================================

15. ACADEMIC SEMESTERS

============================================================



Create these six default semesters:



1. 1st Semester

2. 2nd Semester

3. 3rd Semester

4. 4th Semester

5. 5th Semester

6. 6th Semester



These must be stored in Supabase.



Do NOT permanently hard-code them into the UI.



Admin can:



- Add Semester

- Edit Semester

- Remove Semester

- Reorder Semester



When Admin adds a semester:



It must automatically appear in the Student Browse system.



When Admin removes one:



It should no longer be available for normal selection.



If it contains related content, show a proper confirmation/warning before destructive action.



============================================================

16. DEFAULT SUBJECTS

============================================================



Initially create:



1. Chemistry

2. Physics

3. Maths

4. Ic

5. IKS

6. Computer



Store subjects in Supabase.



Admin can:



- Add Subject

- Edit Subject

- Remove Subject

- Reorder Subject



When a Subject is added:



It becomes available in the relevant semester.



Do not permanently hard-code subjects.



============================================================

17. IMPORTANT SUBJECT LOGIC

============================================================



Subjects belong to Semesters.



Therefore the database relationship must support:



Semester 1

→ Chemistry



Semester 2

→ Chemistry



etc.



The same subject name may exist in multiple semesters if Admin creates it there.



Do not assume every subject belongs to every semester automatically unless it is explicitly created.



============================================================

18. UNIT SYSTEM

============================================================



Units must be manually created.



Admin interface:



Add Unit



Show:



Unit Name

[________________]



Example:



Unit 1

Unit 2

Unit 3



Admin can:



- Add Unit

- Edit Unit

- Remove Unit

- Reorder Unit



Unit belongs to a Subject.



Database relationship:



Semester

→ Subject

→ Unit



Do NOT make Units fixed/predefined.



============================================================

19. TOPIC SYSTEM

============================================================



Topics must also be manually created.



Admin interface:



Add Topic



Show:



Topic Name

[________________]



Example:



Atomic Structure



Admin can:



- Add Topic

- Edit Topic

- Remove Topic

- Reorder Topic



Topic belongs to a Unit.



Database relationship:



Semester

→ Subject

→ Unit

→ Topic



Do NOT make Topics fixed/predefined.



============================================================

20. DOCUMENT STRUCTURE

============================================================



Every document must belong to:



Semester

+

Subject

+

Unit

+

Topic



Example:



1st Semester

→ Chemistry

→ Unit 1

→ Atomic Structure

→ Atomic Structure Notes.pdf



This hierarchy must be enforced through database relationships.



============================================================

21. STUDENT BROWSE

============================================================



The main student discovery feature is:



BROWSE



Do NOT make a traditional search box the main interface.



Student opens Browse.



Show:



1st Semester

2nd Semester

3rd Semester

4th Semester

5th Semester

6th Semester



Student selects a semester.



Then show Subjects belonging to that semester.



Student selects Subject.



Then show Units.



Student selects Unit.



Then show Topics.



Student selects Topic.



Then show Documents.



Flow:



Browse

↓

Semester

↓

Subject

↓

Unit

↓

Topic

↓

Documents



Keep this extremely easy to understand.



============================================================

22. FILTER SYSTEM

============================================================



In addition to hierarchical browsing, provide a Filter interface.



Filters:



- Semester

- Subject

- Unit

- Topic

- Document Type

- Recently Added



Students can combine filters.



Example:



Semester:

1st Semester



Subject:

Chemistry



Unit:

Unit 1



Topic:

Atomic Structure



Results should contain only matching documents.



Provide:



Apply Filters

Clear Filters



Show active filters as clean chips.



The filter UI should be mobile-friendly.



Use a premium bottom-sheet style on mobile.



============================================================

23. DOCUMENT CARDS

============================================================



Display documents in clean premium cards.



Show:



- File type icon

- Title

- Subject

- Unit

- Topic

- File size

- Upload date



Keep the card visually simple.



Do not overload it.



============================================================

24. DOCUMENT VIEWING

============================================================



When a Student taps a document:



Open Document Details.



Show:



Title

Subject

Unit

Topic

File type

File size

Upload date



Actions:



View

Download



PDF:



Real in-app PDF viewer.



Images:



Real image viewer with zoom.



Other document types:



If browser preview is supported, preview it.



Otherwise show:



File information

Download



Do NOT create fake preview functionality.



============================================================

25. DOCUMENT DOWNLOAD

============================================================



Download must use the real Supabase Storage file.



Do not create fake download buttons.



Only authorized users can download documents.



Students can download approved documents.



============================================================

26. DOCUMENT UPLOAD

============================================================



Use Supabase Storage.



Storage bucket:



study-materials



Admin:



Full upload permission.



Owner:



Full upload permission.



Captain:



Upload permission.



Student:



No upload permission.



Supported common document formats:



PDF

JPG

JPEG

PNG

WEBP

GIF

DOC

DOCX

XLS

XLSX

PPT

PPTX

TXT

CSV

ZIP



Block dangerous executable/script files.



Validate:



- MIME type

- File extension

- File size

- File name



Sanitize file names.



Show real upload progress.



============================================================

27. ADMIN UPLOAD FLOW

============================================================



Admin:



Upload

↓

Select Semester

↓

Select Subject

↓

Select Unit

↓

Select Topic

↓

Enter Title

↓

Optional Description

↓

Select File

↓

Upload to Supabase Storage

↓

Create document metadata

↓

status = approved

↓

Document becomes available to Students



============================================================

28. CAPTAIN UPLOAD FLOW

============================================================



Captain:



Upload

↓

Select Semester

↓

Select Subject

↓

Select Unit

↓

Select Topic

↓

Enter Title

↓

Optional Description

↓

Select File

↓

Upload to Supabase Storage

↓

Create metadata

↓

status = pending

↓

Show "Waiting for Admin approval"



Students cannot see pending documents.



============================================================

29. ADMIN APPROVAL

============================================================



Admin has:



Pending Uploads



For every pending Captain document:



Show:



- Title

- Uploaded by

- Semester

- Subject

- Unit

- Topic

- File type

- Upload date



Actions:



Approve

Reject

Delete



Approve:



pending

↓

approved

↓

Students can see document



Reject:



pending

↓

rejected

↓

Students cannot see document



============================================================

30. ADMIN DASHBOARD

============================================================



Admin Dashboard must be premium and functional.



Sections:



Dashboard

Students

Captains

Semesters

Subjects

Units

Topics

Documents

Pending Uploads

Activity



Dashboard statistics:



- Total Students

- Total Captains

- Total Admins

- Total Semesters

- Total Subjects

- Total Units

- Total Topics

- Total Documents

- Pending Uploads



Statistics must come from the actual database.



Do not use fake numbers.



============================================================

31. ADMIN STUDENT MANAGEMENT

============================================================



Admin can:



- View Students

- View student profile

- Enable/disable student

- Promote Student → Captain

- Revoke Captain → Student



Admin must NOT be able to:



- Make themselves Owner

- Modify Owner

- Delete Owner

- Disable Owner

- Demote Owner



============================================================

32. ADMIN ACADEMIC MANAGEMENT

============================================================



Admin can manage:



Semesters

Subjects

Units

Topics



All changes must immediately reflect in the student application.



Example:



Admin adds:



7th Semester



Then it should automatically appear in Browse.



Admin adds:



Biology



under:



3rd Semester



Then students browsing 3rd Semester can see Biology.



Admin adds:



Unit 4



under Biology.



Then students can see Unit 4.



Admin adds:



Cell Structure



under Unit 4.



Then students can see the Topic.



============================================================

33. DELETE SAFETY

============================================================



When Admin tries to delete:



Semester

Subject

Unit

Topic



Check for related records.



If related content exists:



Show a clear warning.



Do not silently destroy related documents.



Use safe deletion or require explicit confirmation.



Prevent broken/orphaned document relationships.



============================================================

34. OWNER MANAGEMENT

============================================================



Owner Dashboard must include everything Admin has.



Additionally:



Admin Management

Role Management

Application Settings

Advanced Controls



Owner can:



- Add/manage Admins

- Remove Admin permissions

- Manage roles

- Manage all application data

- Manage all documents

- Manage all academic content



Admin cannot control Owner.



Owner cannot be demoted by Admin.



============================================================

35. PROFILE

============================================================



Student profile:



- Google profile photo

- Name

- Email

- Subject

- Roll Number



Student can edit permitted profile information.



Student cannot edit:



Role

Permissions

Account status



Captain has the same profile experience.



Owner can still use normal profile/student experience.



============================================================

36. SUPABASE DATABASE

============================================================



Use Supabase PostgreSQL.



Create these tables:



profiles

semesters

subjects

units

topics

documents

activity_logs



Profiles:



id

name

email

avatar_url

subject

roll_number

role

is_active

created_at

updated_at



Roles:



student

captain

admin

owner



Semesters:



id

name

display_order

created_at

updated_at



Subjects:



id

semester_id

name

display_order

created_at

updated_at



Units:



id

subject_id

name

display_order

created_at

updated_at



Topics:



id

unit_id

name

display_order

created_at

updated_at



Documents:



id

semester_id

subject_id

unit_id

topic_id

uploaded_by

title

description

file_name

file_path

file_type

mime_type

file_size

status

created_at

updated_at



Activity Logs:



id

actor_id

action

target_type

target_id

metadata

created_at



Use proper foreign keys, indexes and constraints.



============================================================

37. SUPABASE AUTH

============================================================



Use Supabase Auth for Google authentication.



Google users:



Student

Captain

Owner



Admin authentication must be secure.



After authentication, always load the user's profile and role.



Never trust a role supplied by the browser.



============================================================

38. SUPABASE RLS

============================================================



Implement proper Row Level Security.



STUDENT:



Can read approved academic content.



Can read approved documents.



Can update only permitted fields of their own profile.



Cannot:



Insert documents

Update documents

Delete documents

Approve documents

Modify academic structure

Modify roles

Manage users



CAPTAIN:



Can do everything Student can.



Additionally:



Can create document uploads.



Cannot:



Manage users

Manage academic structure

Manage roles

Approve documents

Delete other users' documents



ADMIN:



Can manage normal application content.



Can manage:



Students

Captains

Semesters

Subjects

Units

Topics

Documents

Pending uploads



Cannot modify Owner.



OWNER:



Full authorized access.



============================================================

39. STORAGE SECURITY

============================================================



Supabase Storage bucket:



study-materials



Student:

Read approved documents.



Captain:

Read approved documents + upload.



Admin:

Full normal document management.



Owner:

Full access.



Storage policies must match application roles.



Do not expose Supabase service-role keys.



============================================================

40. ACTIVITY LOGGING

============================================================



Log important actions:



- New user

- Student profile creation

- Student enabled/disabled

- Student promoted to Captain

- Captain revoked

- Document upload

- Document approval

- Document rejection

- Document deletion

- Document replacement

- Semester created/edited/deleted

- Subject created/edited/deleted

- Unit created/edited/deleted

- Topic created/edited/deleted

- Admin management changes



Only authorized Admin/Owner can see activity logs.



============================================================

41. HOME

============================================================



Student Home must be simple.



Show:



Greeting

Student name



Quick action:



Browse Study Material



Recently Added



Show recently approved documents.



Do not clutter Home.



============================================================

42. STUDENT-FRIENDLY UX

============================================================



The student should not feel like they are using an administrative system.



Student UI should contain only what students actually need.



Use simple labels:



Home

Browse

Subjects

Units

Topics

Documents

View

Download

Profile



Avoid technical terms.



============================================================

43. RESPONSIVE DESIGN

============================================================



Build mobile-first.



Most users will use Android phones.



Support:



Android

iPhone

Tablet

Desktop



Requirements:



- No horizontal scrolling

- No broken layouts

- No overlapping text

- Touch-friendly controls

- Large enough tap targets

- Responsive cards

- Responsive forms

- Responsive navigation



============================================================

44. PERFORMANCE

============================================================



The application must be fast.



Target approximately 60 FPS for animations and scrolling.



Optimize for mid-range Android phones.



Use:



- Efficient React rendering

- Lazy loading

- Pagination

- Database indexes

- Optimized queries

- Image optimization

- Minimal unnecessary re-renders

- Efficient state management



Animations should primarily use:



transform

opacity

scale



Avoid expensive animations.



============================================================

45. ANIMATIONS

============================================================



Include tasteful premium animations for:



- Page transitions

- Bottom navigation

- Active navigation item

- Buttons

- Cards

- Filter panel

- Bottom sheets

- Modals

- Upload progress

- Success states

- Document opening

- Loading states



Animations must be smooth and quick.



Do NOT use excessive animations.



The application must still feel fast.



============================================================

46. LOADING STATES

============================================================



Every async operation must have a proper loading state.



Examples:



Google login:

Loading state



Profile creation:

Loading state



Browse:

Skeleton loading



Document list:

Skeleton loading



Document viewer:

Loading state



Upload:

Real progress indicator



Admin actions:

Loading state



Never leave the user staring at a frozen interface.



============================================================

47. ERROR STATES

============================================================



Use friendly error messages.



Examples:



Google authentication failed:

"Unable to sign in. Please try again."



Upload failed:

"Upload failed. Please try again."



No permission:

"You don't have permission to perform this action."



Network error:

"Something went wrong. Please check your connection and try again."



Do not expose technical database errors to students.



============================================================

48. EMPTY STATES

============================================================



Examples:



No subjects:



"No subjects added yet."



No units:



"No units added yet."



No topics:



"No topics added yet."



No documents:



"No study material available yet."



No filter results:



"No documents found for these filters."



Make empty states visually polished.



============================================================

49. SECURITY

============================================================



Security must be real.



Never rely only on frontend UI.



Enforce permissions using:



Supabase Auth

Supabase RLS

Secure backend/server logic

Storage policies



A malicious Student must not be able to upload by manually calling an API.



A Captain must not be able to perform Admin actions by manually calling an API.



An Admin must not be able to modify Owner by manually calling an API.



Users must not be able to change their own role.



Users must not be able to promote themselves.



============================================================

50. ROUTE PROTECTION

============================================================



Protect Admin routes.



Protect Owner routes.



If unauthenticated:



Redirect to Login.



If Student tries Admin route:



Deny access.



If Captain tries Admin route:



Deny access.



If Admin tries Owner-only route:



Deny access.



If Owner:



Allow Owner routes.



Do not rely on hidden navigation buttons as security.



============================================================

51. AUTHENTICATION TESTING

============================================================



Before declaring the app complete, actually test:



TEST 1:

New Student Google Login.



Expected:

Google authentication works.

Profile setup appears.



TEST 2:

Existing Student Google Login.



Expected:

No profile setup.

Home opens.



TEST 3:

Student logout.



Expected:

Session ends.

Login screen appears.



TEST 4:

Admin Login.



ID:

3024



Password:

3024302



Expected:

Admin Dashboard opens.



TEST 5:

Wrong Admin credentials.



Expected:

Login rejected.



TEST 6:

Captain Google Login.



Expected:

Student experience + Upload.



TEST 7:

Owner Google Login.



Account:

gohilarydeepsinh@gmail.com



Expected:

Normal Student experience + Owner management access.



============================================================

52. PERMISSION TESTING

============================================================



TEST:



Student upload attempt.



Expected:

DENIED.



Captain upload.



Expected:

SUCCESS + pending status.



Captain tries Admin function.



Expected:

DENIED.



Admin approves Captain document.



Expected:

Document becomes visible.



Admin attempts Owner modification.



Expected:

DENIED.



Owner manages Admin.



Expected:

SUCCESS.



============================================================

53. ACADEMIC TESTING

============================================================



Verify:



1st Semester exists.



2nd Semester exists.



3rd Semester exists.



4th Semester exists.



5th Semester exists.



6th Semester exists.



Verify subjects:



Chemistry

Physics

Maths

Ic

IKS

Computer



Verify:



Admin can add Semester.



Admin can remove Semester.



Admin can add Subject.



Admin can remove Subject.



Admin can add Unit using text input.



Admin can remove Unit.



Admin can add Topic using text input.



Admin can remove Topic.



Verify all changes appear correctly in Student Browse.



============================================================

54. DOCUMENT TESTING

============================================================



Test:



Admin upload PDF.



Expected:

Upload succeeds.

Document appears immediately.



Captain upload PDF.



Expected:

Pending.



Admin approves.



Expected:

Students can see it.



Student opens PDF.



Expected:

PDF viewer works.



Student downloads PDF.



Expected:

Real file downloads.



Test image upload.



Expected:

Image viewer works.



Test unsupported preview format.



Expected:

File information + download.



============================================================

55. FILTER TESTING

============================================================



Test:



Semester filter.



Subject filter.



Unit filter.



Topic filter.



Document type filter.



Combined filters.



Clear filters.



Expected:



Only matching documents appear.



No fake results.



No stale results after changing filters.



============================================================

56. MOBILE TESTING

============================================================



Test on mobile-sized screens.



Check:



Login

Home

Browse

Filters

Document cards

Document viewer

Download

Profile

Admin screens

Upload screens



No horizontal overflow.



No overlapping components.



Bottom navigation works correctly.



============================================================

57. PERFORMANCE TESTING

============================================================



Test:



Scrolling

Navigation

Filtering

Document lists

Bottom navigation

Page transitions



The application should remain smooth.



Target approximately 60 FPS for UI animations.



Do not sacrifice functionality for animation.



============================================================

58. FINAL QUALITY REQUIREMENT

============================================================



DO NOT say the application is complete merely because the screens exist.



The project is complete ONLY when:



Authentication works.

Google Login works.

Student profile creation works.

Admin Login works.

Captain role works.

Owner role works.

Supabase database works.

Supabase Storage works.

RLS works.

Academic hierarchy works.

Admin management works.

Document upload works.

Document approval works.

Browse works.

Filters work.

Document viewer works.

Downloads work.

Logout works.

Session persistence works.

Protected routes work.

Mobile layout works.

Animations work.

Performance is optimized.



Every visible button must have a real action.



Every displayed statistic must come from real data.



Every document must come from Supabase.



Every permission must be enforced server-side.



Do not leave TODOs for core functionality.



Do not use mock data for production flows.



Do not create placeholder login systems.



Do not create fake authentication.



Do not create fake upload systems.



Do not create fake permissions.



============================================================

FINAL AUTHORITY

============================================================



OWNER >= ADMIN > CAPTAIN > STUDENT



STUDENT:

Read/browse/download only.



CAPTAIN:

Student permissions + document upload only.



ADMIN:

Full normal application management.



OWNER:

Full application control + Admin management.



============================================================

FINAL INSTRUCTION TO LOVABLE

============================================================



Build this entire application now from zero.



First create the complete Supabase database and authentication architecture.



Then implement role-based authorization and RLS.



Then implement the student application.



Then implement Captain upload flow.



Then implement Admin Dashboard.



Then implement Owner management.



Then connect all screens to real data.



Then test every flow described above.



Do not stop at UI generation.



The final result must be a REAL, FUNCTIONAL, SECURE, PREMIUM, STUDENT-FRIENDLY COLLEGE APPLICATION.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sirppcircle.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f2848f9f-e1aa-43b6-b1ea-c9b587255dc6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
