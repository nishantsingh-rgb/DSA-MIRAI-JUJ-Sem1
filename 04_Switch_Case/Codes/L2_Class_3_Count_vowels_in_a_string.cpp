#include <iostream>
#include <cctype>
using namespace std;

int main() {
    string text = "Hello World";
    int count = 0;

    for (int i = 0; i < text.length(); i++) {
        char ch = tolower(text[i]);
        if (ch=='a'||ch=='e'||ch=='i'||ch=='o'||ch=='u') {
            count++;
        }
    }

    cout << "Vowel count in \"" << text << "\": " << count << endl;
    return 0;
}
